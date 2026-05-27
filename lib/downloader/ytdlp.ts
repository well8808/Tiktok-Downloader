import { spawn } from "node:child_process";
import { PATHS } from "../paths";
import { progressBus } from "../progress-bus";
import {
  registerProcess,
  unregisterProcess,
} from "../active-processes";
import { tagError } from "./errors";
import type { VideoInfo, TaggedError } from "./types";

export function parseVideoInfo(json: string, originalUrl: string): VideoInfo {
  const data = JSON.parse(json);
  const handle = data.uploader_id || data.uploader || "tiktok";
  return {
    id: String(data.id),
    url: originalUrl,
    authorHandle: handle.startsWith("@") ? handle : `@${handle}`,
    title: (data.title || data.description || "").slice(0, 200),
    durationSec: Number(data.duration) || 0,
    thumbnailUrl: data.thumbnail || "",
    formats: (data.formats || []).map((f: { format_id: string }) => f.format_id),
  };
}

const PROGRESS_RE = /^\[download\]\s+(\d+(?:\.\d+)?)%/;
export function parseProgressLine(line: string): number | null {
  const m = line.match(PROGRESS_RE);
  return m && m[1] !== undefined ? Number(m[1]) : null;
}

export async function probe(url: string): Promise<VideoInfo> {
  return new Promise((resolve, reject) => {
    const proc = spawn(PATHS.ytdlpExe, [
      "--dump-json",
      "--no-warnings",
      "--no-playlist",
      url,
    ]);
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (d) => (stdout += d.toString()));
    proc.stderr.on("data", (d) => (stderr += d.toString()));
    proc.on("error", () =>
      reject({
        code: "network",
        message: "Sem conexão com a internet",
      } satisfies TaggedError),
    );
    proc.on("close", (code) => {
      if (code === 0 && stdout.trim()) {
        try {
          resolve(parseVideoInfo(stdout, url));
        } catch {
          reject(tagError(stderr || stdout, code));
        }
      } else {
        reject(tagError(stderr, code));
      }
    });
  });
}

export async function downloadVideo(
  jobId: string,
  url: string,
  outputPath: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(PATHS.ytdlpExe, [
      "--format",
      "bv*+ba/b[ext=mp4]/best",
      "--merge-output-format",
      "mp4",
      "--no-warnings",
      "--no-write-info-json",
      "--no-write-thumbnail",
      "--no-playlist",
      "--newline",
      "-o",
      outputPath,
      url,
    ]);
    registerProcess(jobId, proc);
    let stderr = "";
    proc.stdout.on("data", (chunk) => {
      const lines = chunk.toString().split(/\r?\n/);
      for (const line of lines) {
        const pct = parseProgressLine(line);
        if (pct !== null) {
          progressBus.emitProgress({
            jobId,
            status: "DOWNLOADING",
            percent: pct,
          });
        }
      }
    });
    proc.stderr.on("data", (d) => (stderr += d.toString()));
    proc.on("error", () => {
      unregisterProcess(jobId);
      reject({
        code: "network",
        message: "Sem conexão com a internet",
      } satisfies TaggedError);
    });
    proc.on("close", (code, signal) => {
      unregisterProcess(jobId);
      if (signal === "SIGTERM") {
        reject({
          code: "ytdlp_failed",
          message: "Download cancelado",
        } satisfies TaggedError);
        return;
      }
      if (code === 0) resolve();
      else reject(tagError(stderr, code));
    });
  });
}
