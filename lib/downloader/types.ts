export type JobStatus =
  | "PENDING"
  | "VALIDATING"
  | "DOWNLOADING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export type ErrorCode =
  | "private_or_deleted"
  | "geo_blocked"
  | "invalid_url"
  | "rate_limited"
  | "network"
  | "ytdlp_failed"
  | "ffmpeg_failed";

export interface VideoInfo {
  id: string;
  url: string;
  authorHandle: string;
  title: string;
  durationSec: number;
  thumbnailUrl: string;
  formats: string[];
}

export interface JobProgress {
  jobId: string;
  status: JobStatus;
  percent: number;
  message?: string;
  filePath?: string;
}

export interface TaggedError {
  code: ErrorCode;
  message: string;
  detail?: string;
}
