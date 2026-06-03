import { join, extname } from "node:path";
import { existsSync } from "node:fs";

/** Extensões de vídeo aceitas pela limpeza de metadados. */
export const VIDEO_EXTS = new Set([
  ".mp4",
  ".mov",
  ".m4v",
  ".webm",
  ".mkv",
  ".avi",
]);

/** True se o caminho tem uma extensão de vídeo suportada. */
export function isSupportedVideo(filePath: string): boolean {
  return VIDEO_EXTS.has(extname(filePath).toLowerCase());
}

/**
 * Acha um nome livre em destDir, sem sobrescrever um limpo anterior:
 * "video.mp4" → "video (1).mp4" → "video (2).mp4" ...
 *
 * `exists` é injetável pra teste; em produção usa fs.existsSync.
 */
export function uniqueDest(
  destDir: string,
  fileName: string,
  exists: (p: string) => boolean = existsSync,
): string {
  const ext = extname(fileName);
  const stem = fileName.slice(0, fileName.length - ext.length);
  let candidate = join(destDir, fileName);
  let n = 1;
  while (exists(candidate)) {
    candidate = join(destDir, `${stem} (${n})${ext}`);
    n += 1;
  }
  return candidate;
}
