const TIKTOK_URL = /^https?:\/\/(www\.|vm\.|m\.)?tiktok\.com\/.+/i;

export function validateTikTokUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!TIKTOK_URL.test(trimmed)) return false;
  try {
    new URL(trimmed);
    return true;
  } catch {
    return false;
  }
}

export function parseUrlList(text: string): string[] {
  return text
    .split(/[\r\n]+/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}
