import { db } from "./db";
import { homedir } from "node:os";
import { join } from "node:path";

export type AppSettings = {
  downloadFolder: string;
  autoStripMetadata: boolean;
  alwaysExtractMp3: boolean;
  logRawUrl: boolean;
};

const DEFAULTS: AppSettings = {
  downloadFolder:
    process.env.TTDL_DOWNLOAD_DIR || join(homedir(), "Videos", "TikTok"),
  autoStripMetadata: true,
  alwaysExtractMp3: false,
  logRawUrl: false,
};

export async function getSettings(): Promise<AppSettings> {
  const rows = await db.setting.findMany();
  const map = new Map(rows.map((r) => [r.key, r.value]));
  return {
    downloadFolder: map.get("downloadFolder") ?? DEFAULTS.downloadFolder,
    autoStripMetadata: (map.get("autoStripMetadata") ?? "true") === "true",
    alwaysExtractMp3: (map.get("alwaysExtractMp3") ?? "false") === "true",
    logRawUrl: (map.get("logRawUrl") ?? "false") === "true",
  };
}

export async function setSetting<K extends keyof AppSettings>(
  key: K,
  value: AppSettings[K],
): Promise<void> {
  const str = String(value);
  await db.setting.upsert({
    where: { key },
    create: { key, value: str },
    update: { value: str },
  });
}
