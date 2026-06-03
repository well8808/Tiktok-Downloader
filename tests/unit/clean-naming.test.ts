import { describe, it, expect } from "vitest";
import { join } from "node:path";
import { isSupportedVideo, uniqueDest, VIDEO_EXTS } from "@/lib/clean-naming";

describe("isSupportedVideo", () => {
  it("accepts known video extensions (case-insensitive)", () => {
    expect(isSupportedVideo("C:/v/kling.mp4")).toBe(true);
    expect(isSupportedVideo("C:/v/higgs.MOV")).toBe(true);
    expect(isSupportedVideo("clip.WebM")).toBe(true);
  });

  it("rejects non-video and extensionless files", () => {
    expect(isSupportedVideo("foto.png")).toBe(false);
    expect(isSupportedVideo("doc.pdf")).toBe(false);
    expect(isSupportedVideo("semponto")).toBe(false);
  });

  it("covers the documented format set", () => {
    expect(Array.from(VIDEO_EXTS).sort()).toEqual(
      [".avi", ".m4v", ".mkv", ".mov", ".mp4", ".webm"].sort(),
    );
  });
});

describe("uniqueDest", () => {
  it("keeps the original name when nothing collides", () => {
    const out = uniqueDest("/limpos", "video.mp4", () => false);
    expect(out).toBe(join("/limpos", "video.mp4"));
  });

  it("appends an incrementing suffix on collision", () => {
    const taken = new Set([
      join("/limpos", "video.mp4"),
      join("/limpos", "video (1).mp4"),
    ]);
    const out = uniqueDest("/limpos", "video.mp4", (p) => taken.has(p));
    expect(out).toBe(join("/limpos", "video (2).mp4"));
  });

  it("preserves multi-dot stems and the real extension", () => {
    const taken = new Set([join("/limpos", "my.cool.clip.mov")]);
    const out = uniqueDest("/limpos", "my.cool.clip.mov", (p) => taken.has(p));
    expect(out).toBe(join("/limpos", "my.cool.clip (1).mov"));
  });
});
