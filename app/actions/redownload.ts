"use server";

import { createId } from "@paralleldrive/cuid2";
import { db } from "@/lib/db";
import { probe } from "@/lib/downloader/ytdlp";
import { runDownloadJob } from "@/lib/downloader/orchestrator";

export async function redownloadJob(
  oldJobId: string,
): Promise<
  | { ok: true; jobId: string }
  | { ok: false; errorCode: string; message: string }
> {
  const old = await db.job.findUnique({ where: { id: oldJobId } });
  if (!old) {
    return {
      ok: false,
      errorCode: "invalid_url",
      message: "Job original não encontrado",
    };
  }
  const jobId = createId().slice(0, 8);
  await db.job.create({
    data: {
      id: jobId,
      url: old.url,
      authorHandle: old.authorHandle,
      title: old.title,
      durationSec: old.durationSec,
      thumbnailUrl: old.thumbnailUrl,
      status: "VALIDATING",
    },
  });

  // Re-probe asynchronously to refresh metadata, then download.
  (async () => {
    try {
      const info = await probe(old.url);
      await db.job.update({
        where: { id: jobId },
        data: {
          authorHandle: info.authorHandle,
          title: info.title,
          durationSec: info.durationSec,
          thumbnailUrl: info.thumbnailUrl,
        },
      });
      await runDownloadJob(jobId, old.url, info, {});
    } catch {
      // Orchestrator handles failure state.
    }
  })();

  return { ok: true, jobId };
}
