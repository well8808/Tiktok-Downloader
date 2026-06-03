import { spawn } from "node:child_process";
import { basename } from "node:path";
import { PATHS } from "../paths";
import { ffmpegError, spawnError } from "./errors";
import type { TaggedError } from "./types";

function run(
  exe: string,
  args: string[],
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const proc = spawn(exe, args);
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (d) => (stdout += d.toString()));
    proc.stderr.on("data", (d) => (stderr += d.toString()));
    proc.on("error", (err) =>
      reject(spawnError(err as NodeJS.ErrnoException, basename(exe))),
    );
    proc.on("close", (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(ffmpegError(stderr));
    });
  });
}

export async function stripMetadata(
  inputPath: string,
  outputPath: string,
): Promise<void> {
  await run(PATHS.ffmpegExe, [
    "-y",
    "-i",
    inputPath,
    "-map_metadata",
    "-1",
    "-map_chapters",
    "-1",
    "-c",
    "copy",
    outputPath,
  ]);
}

/**
 * Limpeza profunda de metadados — pra vídeos gerados por IA (Higgsfield,
 * Kling, etc). Remuxa sem reencodar (lossless, rápido) e remove tudo:
 *
 * - `-map_metadata -1`     → metadados globais do container
 * - `-map_metadata:s -1`   → metadados de todas as streams (handler_name etc.)
 * - `-map_chapters -1`     → capítulos
 * - `+bitexact`            → impede o ffmpeg de carimbar a própria assinatura
 *                            (encoder/Lavf) no arquivo de saída
 * - `+faststart`           → moov no início (só efeito em mp4/mov)
 *
 * Reconstruir o container do zero também descarta as caixas não-padrão
 * `uuid`/`jumb` onde ficam as credenciais C2PA / Content Credentials que
 * os geradores de IA embutem — o ffmpeg não as copia no remux.
 *
 * NÃO remove marca d'água invisível em pixels (ex.: SynthID) nem logos
 * visíveis: isso está na imagem, não nos metadados.
 */
export async function stripMetadataDeep(
  inputPath: string,
  outputPath: string,
): Promise<void> {
  await run(PATHS.ffmpegExe, [
    "-y",
    "-i",
    inputPath,
    "-map_metadata",
    "-1",
    "-map_metadata:s",
    "-1",
    "-map_chapters",
    "-1",
    "-fflags",
    "+bitexact",
    "-flags:v",
    "+bitexact",
    "-flags:a",
    "+bitexact",
    "-movflags",
    "+faststart",
    "-c",
    "copy",
    outputPath,
  ]);
}

export async function extractMp3(
  inputPath: string,
  outputPath: string,
): Promise<void> {
  await run(PATHS.ffmpegExe, [
    "-y",
    "-i",
    inputPath,
    "-vn",
    "-acodec",
    "libmp3lame",
    "-ab",
    "320k",
    "-ar",
    "44100",
    outputPath,
  ]);
}

export async function validateMp4(
  path: string,
): Promise<{ duration: number; sizeBytes: number }> {
  const { stdout } = await run(PATHS.ffprobeExe, [
    "-v",
    "error",
    "-show_entries",
    "format=duration,size",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    path,
  ]);
  const lines = stdout.trim().split(/\r?\n/);
  const duration = Number(lines[0] ?? 0);
  const sizeBytes = Number(lines[1] ?? 0);
  if (duration <= 0 || sizeBytes <= 0) {
    throw {
      code: "ffmpeg_failed",
      message: "Arquivo gerado é inválido",
      detail: stdout,
    } satisfies TaggedError;
  }
  return { duration, sizeBytes };
}
