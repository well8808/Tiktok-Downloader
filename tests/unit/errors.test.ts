import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { tagError } from "@/lib/downloader/errors";

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
