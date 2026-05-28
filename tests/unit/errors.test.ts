import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { tagError, spawnError } from "@/lib/downloader/errors";

const fixture = (name: string) =>
  readFileSync(join(__dirname, "../fixtures", name), "utf-8");

describe("tagError", () => {
  it("tags private video", () => {
    const result = tagError(fixture("ytdlp-private.stderr.txt"), 1);
    expect(result.code).toBe("private_or_deleted");
    expect(result.message).toBe("Esse vídeo está privado ou foi removido");
  });

  it("tags geo-blocked video", () => {
    const result = tagError(fixture("ytdlp-geo.stderr.txt"), 1);
    expect(result.code).toBe("geo_blocked");
    expect(result.message).toBe("Vídeo indisponível na sua região");
  });

  it("tags rate limit", () => {
    const result = tagError("HTTP Error 429: Too Many Requests", 1);
    expect(result.code).toBe("rate_limited");
  });

  it("falls back to ytdlp_failed for unknown stderr", () => {
    const result = tagError("ERROR: something weird happened", 1);
    expect(result.code).toBe("ytdlp_failed");
    expect(result.detail).toContain("something weird");
  });

  it("returns network code when exit is null (process killed)", () => {
    const result = tagError("", null);
    expect(result.code).toBe("network");
  });
});

describe("spawnError", () => {
  it("flags ENOENT as missing binary (antivirus), not network", () => {
    const err = Object.assign(new Error("spawn yt-dlp.exe ENOENT"), {
      code: "ENOENT",
      path: "C:/app/bin/yt-dlp.exe",
    });
    const result = spawnError(err, "yt-dlp.exe");
    expect(result.code).toBe("ytdlp_failed");
    expect(result.message).toMatch(/antivírus/i);
    expect(result.message).toContain("yt-dlp.exe");
  });

  it("flags EACCES/EPERM as permission/antivirus issue", () => {
    const err = Object.assign(new Error("permission"), { code: "EACCES" });
    const result = spawnError(err, "ffmpeg.exe");
    expect(result.code).toBe("ytdlp_failed");
    expect(result.message).toMatch(/permiss/i);
  });

  it("falls back to network for genuine spawn errors", () => {
    const err = Object.assign(new Error("connection reset"), {
      code: "ECONNRESET",
    });
    const result = spawnError(err, "yt-dlp.exe");
    expect(result.code).toBe("network");
  });
});
