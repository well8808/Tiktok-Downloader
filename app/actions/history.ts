"use server";

import { db } from "@/lib/db";

export async function listHistory(limit = 100) {
  return db.job.findMany({
    where: { status: "COMPLETED", deletedAt: null },
    orderBy: { finishedAt: "desc" },
    take: limit,
  });
}

export async function deleteJob(jobId: string) {
  await db.job.update({
    where: { id: jobId },
    data: { deletedAt: new Date() },
  });
  return { ok: true };
}

export async function getActiveJobs() {
  return db.job.findMany({
    where: {
      status: { in: ["VALIDATING", "DOWNLOADING", "PROCESSING"] },
      finishedAt: null,
    },
  });
}

export async function cancelStaleJobs() {
  await db.job.updateMany({
    where: {
      status: { in: ["VALIDATING", "DOWNLOADING", "PROCESSING"] },
      finishedAt: null,
    },
    data: { status: "CANCELLED", finishedAt: new Date() },
  });
}
