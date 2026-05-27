import { join } from "node:path";
import { mkdirSync, renameSync, unlinkSync, existsSync } from "node:fs";
import { PATHS, ensureDirs } from "../paths";
import { db } from "../db";
import { log } from "../logger";
import { progressBus } from "../progress-bus";
import { getSettings } from "../config";
import { downloadVideo } from "./ytdlp";
import { stripMetadata, extractMp3, validateMp4 } from "./ffmpeg";
import type { TaggedError, VideoInfo } from "./types";

const SAFE_FILENAME = /[^a-zA-Z0-9_-]/g;
function safeAuthor(handle: string): string {
  return (
    handle.replace(/^@/, "").replace(SAFE_FILENAME, "").slice(0, 20) || "tiktok"
  );
}

export async function runDownloadJob(
  jobId: string,
  url: string,
  info: VideoInfo,
  opts: { extractMp3?: boolean } = {},
): Promise<{ filePath: string; audioPath?: string; sizeBytes: number }> {
  ensureDirs();
  const settings = await getSettings();
  const tmpRaw = join(PATHS.tmp, `${jobId}-raw.mp4`);
  const tmpClean = join(PATHS.tmp, `${jobId}-clean.mp4`);
  const tmpAudio = join(PATHS.tmp, `${jobId}.mp3`);

  try {
    await db.job.update({
      where: { id: jobId },
      data: { status: "DOWNLOADING", startedAt: new Date() },
    });
    progressBus.emitProgress({ jobId, status: "DOWNLOADING", percent: 0 });
    log({ jobId, url, event: "download_start" });

    await downloadVideo(jobId, url, tmpRaw);

    progressBus.emitProgress({
      jobId,
      status: "PROCESSING",
      percent: 100,
      message: "Removendo metadados",
    });
    await db.job.update({
      where: { id: jobId },
      data: { status: "PROCESSING" },
    });

    if (settings.autoStripMetadata) {
      await stripMetadata(tmpRaw, tmpClean);
      try {
        unlinkSync(tmpRaw);
      } catch {
        // ignore
      }
    } else {
      renameSync(tmpRaw, tmpClean);
    }

    const validation = await validateMp4(tmpClean);

    let audioPath: string | undefined;
    if (opts.extractMp3 || settings.alwaysExtractMp3) {
      progressBus.emitProgress({
        jobId,
        status: "PROCESSING",
        percent: 100,
        message: "Extraindo áudio",
      });
      await extractMp3(tmpClean, tmpAudio);
    }

    const date = new Date().toISOString().slice(0, 10);
    const destDir = join(settings.downloadFolder, date);
    mkdirSync(destDir, { recursive: true });
    const fileName = `${safeAuthor(info.authorHandle)}_${jobId}.mp4`;
    const finalPath = join(destDir, fileName);
    renameSync(tmpClean, finalPath);

    if (existsSync(tmpAudio)) {
      const finalAudio = join(destDir, fileName.replace(/\.mp4$/, ".mp3"));
      renameSync(tmpAudio, finalAudio);
      audioPath = finalAudio;
    }

    await db.job.update({
      where: { id: jobId },
      data: {
        status: "COMPLETED",
        filePath: finalPath,
        audioPath: audioPath ?? null,
        fileSizeBytes: validation.sizeBytes,
        finishedAt: new Date(),
      },
    });
    progressBus.emitProgress({ jobId, status: "COMPLETED", percent: 100 });
    log({
      jobId,
      url,
      event: "download_complete",
      sizeBytes: validation.sizeBytes,
    });

    return { filePath: finalPath, audioPath, sizeBytes: validation.sizeBytes };
  } catch (err) {
    for (const p of [tmpRaw, tmpClean, tmpAudio]) {
      try {
        if (existsSync(p)) unlinkSync(p);
      } catch {
        // ignore
      }
    }
    const tagged = err as TaggedError;
    await db.job.update({
      where: { id: jobId },
      data: {
        status: "FAILED",
        errorCode: tagged.code,
        errorMessage: tagged.message,
        finishedAt: new Date(),
      },
    });
    progressBus.emitProgress({
      jobId,
      status: "FAILED",
      percent: 0,
      message: tagged.message,
    });
    log({
      jobId,
      url,
      event: "download_failed",
      errorCode: tagged.code,
      detail: tagged.detail,
    });
    throw tagged;
  }
}
