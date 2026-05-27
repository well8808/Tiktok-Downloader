import { describe, it, expect } from "vitest";
import { validateTikTokUrl, parseUrlList } from "@/lib/downloader/url-validator";

describe("validateTikTokUrl", () => {
  it.each([
    "https://www.tiktok.com/@user/video/7234567890",
    "https://tiktok.com/@user/video/7234567890",
    "https://vm.tiktok.com/ZMabc123/",
    "https://m.tiktok.com/v/7234567890.html",
    "http://www.tiktok.com/@user/video/7234567890",
    "https://www.tiktok.com/@user/video/7234567890?_t=share",
  ])("accepts %s", (url) => {
    expect(validateTikTokUrl(url)).toBe(true);
  });

  it.each([
    "https://youtube.com/watch?v=abc",
    "https://tiktok.fake.com/video/123",
    "tiktok.com/@user/video/123",
    "https://www.tiktok",
    "",
    "not a url",
  ])("rejects %s", (url) => {
    expect(validateTikTokUrl(url)).toBe(false);
  });
});

describe("parseUrlList", () => {
  it("splits text by newlines and trims", () => {
    const input = "  https://tiktok.com/a  \n\nhttps://tiktok.com/b\r\n  \nhttps://tiktok.com/c\n";
    expect(parseUrlList(input)).toEqual([
      "https://tiktok.com/a",
      "https://tiktok.com/b",
      "https://tiktok.com/c",
    ]);
  });

  it("returns empty array for whitespace-only input", () => {
    expect(parseUrlList("   \n\n  ")).toEqual([]);
  });
});
