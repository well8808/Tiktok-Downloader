"use server";

import { unlinkSync, existsSync } from "node:fs";
import { join } from "node:path";
import { db } from "@/lib/db";
import { PATHS } from "@/lib/paths";
import { killProcess } from "@/lib/active-processes";
import { progressBus } from "@/lib/progress-bus";
import { log } from "@/lib/logger";

export async function cancelJob(jobId: string) {
  const killed = killProcess(jobId);

  for (const suffix of ["-raw.mp4", "-clean.mp4", ".mp3"]) {
    const p = join(PATHS.tmp, `${jobId}${suffix}`);
    try {
      if (existsSync(p)) unlinkSync(p);
    } catch {
      // ignore
    }
  }

  await db.job.update({
    where: { id: jobId },
    data: {
      status: "CANCELLED",
      finishedAt: new Date(),
      errorMessage: "Download cancelado",
    },
  });

  progressBus.emitProgress({
    jobId,
    status: "CANCELLED",
    percent: 0,
    message: "Download cancelado",
  });

  log({ jobId, event: "download_cancelled", processKilled: killed });

  return { ok: true, processKilled: killed };
}
