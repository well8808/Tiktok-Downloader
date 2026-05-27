"use server";

import { db } from "@/lib/db";
import { runDownloadJob } from "@/lib/downloader/orchestrator";

export async function startDownload(
  jobId: string,
  opts: { extractMp3?: boolean } = {},
): Promise<{ ok: true } | { ok: false; errorCode: string; message: string }> {
  const job = await db.job.findUnique({ where: { id: jobId } });
  if (!job) {
    return { ok: false, errorCode: "invalid_url", message: "Job não encontrado" };
  }
  const info = {
    id: job.id,
    url: job.url,
    authorHandle: job.authorHandle ?? "@tiktok",
    title: job.title ?? "",
    durationSec: job.durationSec ?? 0,
    thumbnailUrl: job.thumbnailUrl ?? "",
    formats: [],
  };
  runDownloadJob(jobId, job.url, info, opts).catch(() => {
    // Orchestrator handles failure state internally.
  });
  return { ok: true };
}
