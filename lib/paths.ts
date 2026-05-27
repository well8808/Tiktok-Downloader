import { join, resolve } from "node:path";
import { mkdirSync, existsSync } from "node:fs";

const ROOT = resolve(process.cwd());

export const PATHS = {
  bin: join(ROOT, "bin"),
  ytdlpExe: join(ROOT, "bin", "yt-dlp.exe"),
  ffmpegExe: join(ROOT, "bin", "ffmpeg.exe"),
  ffprobeExe: join(ROOT, "bin", "ffprobe.exe"),
  tmp: join(ROOT, ".tmp"),
  logs: join(ROOT, "logs"),
};

export function ensureDirs() {
  for (const dir of [PATHS.bin, PATHS.tmp, PATHS.logs]) {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  }
}
