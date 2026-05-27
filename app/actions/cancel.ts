"use server";

import { db } from "@/lib/db";

export async function cancelJob(jobId: string) {
  await db.job.update({
    where: { id: jobId },
    data: { status: "CANCELLED", finishedAt: new Date() },
  });
  return { ok: true };
}
