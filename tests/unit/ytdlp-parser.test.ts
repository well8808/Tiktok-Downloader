import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseVideoInfo, parseProgressLine } from "@/lib/downloader/ytdlp";

const fixture = (name: string) =>
  readFileSync(join(__dirname, "../fixtures", name), "utf-8");

describe("parseVideoInfo", () => {
  it("parses yt-dlp --dump-json output", () => {
    const info = parseVideoInfo(
      fixture("ytdlp-success.json"),
      "https://tiktok.com/@joao/video/7234567890",
    );
    expect(info.id).toBe("7234567890");
    expect(info.authorHandle).toBe("@joao");
    expect(info.title).toBe("Caption do post de teste");
    expect(info.durationSec).toBe(32);
    expect(info.thumbnailUrl).toContain("https://");
  });
});

describe("parseProgressLine", () => {
  it.each([
    ["[download]   0.0% of 5.21MiB at Unknown speed ETA Unknown", 0],
    ["[download]  23.4% of 5.21MiB at  1.20MiB/s ETA 00:03", 23.4],
    ["[download]  87.2% of 5.21MiB at  2.10MiB/s ETA 00:00", 87.2],
    ["[download] 100% of 5.21MiB in 00:02", 100],
  ])("extracts percent from %s", (line, expected) => {
    expect(parseProgressLine(line as string)).toBe(expected);
  });

  it("returns null for non-progress lines", () => {
    expect(parseProgressLine("[generic] foo bar")).toBeNull();
  });
});
