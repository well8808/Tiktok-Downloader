"use server";

import { join, basename, extname } from "node:path";
import { existsSync, mkdirSync, statSync, unlinkSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { PATHS, ensureDirs, moveFile } from "@/lib/paths";
import { stripMetadataDeep } from "@/lib/downloader/ffmpeg";
import { getSettings } from "@/lib/config";
import { log } from "@/lib/logger";
import { isSupportedVideo, uniqueDest } from "@/lib/clean-naming";
import type { TaggedError } from "@/lib/downloader/types";

export type CleanResult =
  | { ok: true; outPath: string; fileName: string }
  | { ok: false; errorCode: string; message: string };

/**
 * Remove TODOS os metadados de um vídeo local (foco em vídeos de IA —
 * Higgsfield, Kling, etc) e salva uma cópia limpa na pasta de limpos,
 * preservando o original. Remux lossless via ffmpeg (sem reencode).
 *
 * Isolado por arquivo: o cliente chama uma vez por vídeo, em sequência,
 * e um erro num arquivo não derruba os outros.
 */
export async function cleanVideo(inputPath: string): Promise<CleanResult> {
  const path = (inputPath ?? "").trim();
  if (!path) {
    return { ok: false, errorCode: "invalid_input", message: "Caminho vazio" };
  }

  const ext = extname(path).toLowerCase();
  if (!isSupportedVideo(path)) {
    return {
      ok: false,
      errorCode: "invalid_input",
      message: `Formato não suportado (${ext || "sem extensão"})`,
    };
  }

  try {
    if (!statSync(path).isFile()) {
      return {
        ok: false,
        errorCode: "invalid_input",
        message: "Não é um arquivo",
      };
    }
  } catch {
    return {
      ok: false,
      errorCode: "invalid_input",
      message: "Arquivo não encontrado",
    };
  }

  ensureDirs();
  const settings = await getSettings();
  const destDir = settings.cleanFolder;
  const tmpOut = join(PATHS.tmp, `clean-${randomUUID()}${ext}`);

  try {
    mkdirSync(destDir, { recursive: true });
    await stripMetadataDeep(path, tmpOut);

    const finalPath = uniqueDest(destDir, basename(path));
    moveFile(tmpOut, finalPath);

    log({ event: "clean_complete", file: basename(path) });
    return { ok: true, outPath: finalPath, fileName: basename(finalPath) };
  } catch (err) {
    try {
      if (existsSync(tmpOut)) unlinkSync(tmpOut);
    } catch {
      // ignore
    }
    const tagged = err as TaggedError;
    log({
      event: "clean_failed",
      file: basename(path),
      errorCode: tagged.code,
      detail: tagged.detail,
    });
    return {
      ok: false,
      errorCode: tagged.code ?? "ffmpeg_failed",
      message: tagged.message ?? "Erro ao limpar o vídeo",
    };
  }
}
