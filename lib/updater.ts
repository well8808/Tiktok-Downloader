import { writeFileSync, renameSync, existsSync } from "node:fs";
import { PATHS } from "./paths";
import { db } from "./db";

const YTDLP_RELEASES =
  "https://api.github.com/repos/yt-dlp/yt-dlp/releases/latest";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export async function checkAndUpdateYtdlp(
  force = false,
): Promise<{ updated: boolean; version: string }> {
  const last = await db.setting.findUnique({
    where: { key: "lastUpdateCheck" },
  });
  if (!force && last) {
    const ts = Number(last.value);
    if (Date.now() - ts < ONE_DAY_MS) {
      const current = await db.setting.findUnique({
        where: { key: "ytdlpVersion" },
      });
      return { updated: false, version: current?.value ?? "unknown" };
    }
  }
  const res = await fetch(YTDLP_RELEASES, {
    headers: { "User-Agent": "tiktok-downloader" },
  });
  if (!res.ok) throw new Error(`GitHub API failed: ${res.status}`);
  const data = (await res.json()) as {
    tag_name: string;
    assets: Array<{ name: string; browser_download_url: string }>;
  };
  const tag = data.tag_name;
  const current = await db.setting.findUnique({
    where: { key: "ytdlpVersion" },
  });
  await db.setting.upsert({
    where: { key: "lastUpdateCheck" },
    create: { key: "lastUpdateCheck", value: String(Date.now()) },
    update: { value: String(Date.now()) },
  });
  if (current?.value === tag && existsSync(PATHS.ytdlpExe)) {
    return { updated: false, version: tag };
  }
  const asset = data.assets.find((a) => a.name === "yt-dlp.exe");
  if (!asset) throw new Error("yt-dlp.exe asset not found in release");
  const dl = await fetch(asset.browser_download_url);
  if (!dl.ok) throw new Error(`Download failed: ${dl.status}`);
  const buf = Buffer.from(await dl.arrayBuffer());
  if (buf.length < 5_000_000) throw new Error("Downloaded file too small");
  const tmpPath = `${PATHS.ytdlpExe}.new`;
  writeFileSync(tmpPath, buf);
  if (existsSync(PATHS.ytdlpExe)) {
    try {
      renameSync(PATHS.ytdlpExe, `${PATHS.ytdlpExe}.bak`);
    } catch {
      // ignore lock failures; we'll overwrite below
    }
  }
  renameSync(tmpPath, PATHS.ytdlpExe);
  await db.setting.upsert({
    where: { key: "ytdlpVersion" },
    create: { key: "ytdlpVersion", value: tag },
    update: { value: tag },
  });
  return { updated: true, version: tag };
}
