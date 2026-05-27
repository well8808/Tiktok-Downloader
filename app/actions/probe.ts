"use server";

import { createId } from "@paralleldrive/cuid2";
import { db } from "@/lib/db";
import { probe } from "@/lib/downloader/ytdlp";
import { validateTikTokUrl } from "@/lib/downloader/url-validator";
import type { VideoInfo } from "@/lib/downloader/types";

export async function probeUrl(
  url: string,
): Promise<
  | { ok: true; info: VideoInfo; jobId: string }
  | { ok: false; errorCode: string; message: string }
> {
  if (!validateTikTokUrl(url)) {
    return {
      ok: false,
      errorCode: "invalid_url",
      message:
        "Esse link não parece ser do TikTok. Cole o link completo do post.",
    };
  }
  try {
    const info = await probe(url);
    const jobId = createId().slice(0, 8);
    await db.job.create({
      data: {
        id: jobId,
        url,
        authorHandle: info.authorHandle,
        title: info.title,
        durationSec: info.durationSec,
        thumbnailUrl: info.thumbnailUrl,
        status: "VALIDATING",
      },
    });
    return { ok: true, info, jobId };
  } catch (err) {
    const e = err as { code: string; message: string };
    return { ok: false, errorCode: e.code, message: e.message };
  }
}
