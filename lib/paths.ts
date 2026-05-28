import { join, resolve } from "node:path";
import {
  mkdirSync,
  existsSync,
  renameSync,
  copyFileSync,
  unlinkSync,
} from "node:fs";

/**
 * Path resolver — funciona tanto em dev (cwd do projeto) quanto
 * empacotado no Electron (caminhos via env injetadas pelo main process).
 */

const ROOT = resolve(process.cwd());

const binDir = process.env.TTDL_BIN_DIR || join(ROOT, "bin");
const tmpDir = process.env.TTDL_TMP_DIR || join(ROOT, ".tmp");
const logsDir = process.env.TTDL_LOGS_DIR || join(ROOT, "logs");

export const PATHS = {
  bin: binDir,
  ytdlpExe: join(binDir, "yt-dlp.exe"),
  ffmpegExe: join(binDir, "ffmpeg.exe"),
  ffprobeExe: join(binDir, "ffprobe.exe"),
  tmp: tmpDir,
  logs: logsDir,
};

export function ensureDirs() {
  for (const dir of [PATHS.tmp, PATHS.logs]) {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  }
  // bin/ é read-only em prod (extraResources), não cria.
  if (!process.env.TTDL_BIN_DIR && !existsSync(PATHS.bin)) {
    mkdirSync(PATHS.bin, { recursive: true });
  }
}

/**
 * Move um arquivo. Usa rename (rápido, atômico) quando src e dest estão no
 * mesmo volume; cai pra copy+unlink quando estão em drives diferentes
 * (renameSync joga EXDEV cross-device no Windows: .tmp em C: → Downloads em D:).
 */
export function moveFile(src: string, dest: string): void {
  try {
    renameSync(src, dest);
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "EXDEV") {
      copyFileSync(src, dest);
      unlinkSync(src);
    } else {
      throw err;
    }
  }
}
