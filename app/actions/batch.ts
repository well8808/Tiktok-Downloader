"use server";

import { createId } from "@paralleldrive/cuid2";
import { db } from "@/lib/db";
import { probe } from "@/lib/downloader/ytdlp";
import {
  validateTikTokUrl,
  parseUrlList,
} from "@/lib/downloader/url-validator";
import { runDownloadJob } from "@/lib/downloader/orchestrator";
import { downloadQueue } from "@/lib/queue";

export async function startBatch(
  text: string,
): Promise<
  | { ok: true; batchId: string; jobIds: string[] }
  | { ok: false; message: string }
> {
  const urls = parseUrlList(text);
  if (urls.length === 0) return { ok: false, message: "Cole pelo menos uma URL" };
  if (urls.length > 100)
    return { ok: false, message: "Máximo 100 URLs por lote" };
  const batchId = createId().slice(0, 8);
  const jobIds: string[] = [];

  for (const url of urls) {
    const jobId = createId().slice(0, 8);
    jobIds.push(jobId);
    const isValid = validateTikTokUrl(url);
    await db.job.create({
      data: {
        id: jobId,
        url,
        status: isValid ? "PENDING" : "FAILED",
        errorCode: isValid ? null : "invalid_url",
        errorMessage: isValid ? null : "URL inválida",
        isBatch: true,
        batchId,
      },
    });
    if (!isValid) continue;
    downloadQueue.add(async () => {
      try {
        const info = await probe(url);
        await db.job.update({
          where: { id: jobId },
          data: {
            authorHandle: info.authorHandle,
            title: info.title,
            durationSec: info.durationSec,
            thumbnailUrl: info.thumbnailUrl,
          },
        });
        await runDownloadJob(jobId, url, info, {});
      } catch {
        // Orchestrator already handles failure state.
      }
    });
  }

  return { ok: true, batchId, jobIds };
}
