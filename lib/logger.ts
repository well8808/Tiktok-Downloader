import { appendFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { PATHS, ensureDirs } from "./paths";

type LogEvent = {
  jobId?: string;
  url?: string;
  event: string;
  [k: string]: unknown;
};

let LOG_RAW_URL = false;
export function setLogRawUrl(value: boolean) {
  LOG_RAW_URL = value;
}

export function log(event: LogEvent) {
  ensureDirs();
  const date = new Date().toISOString().slice(0, 10);
  const file = join(PATHS.logs, `${date}.log`);
  const safe: LogEvent = { ...event, timestamp: new Date().toISOString() };
  if (safe.url && !LOG_RAW_URL) {
    safe.url_hash = createHash("sha256")
      .update(String(safe.url))
      .digest("hex")
      .slice(0, 16);
    delete safe.url;
  }
  appendFileSync(file, JSON.stringify(safe) + "\n", "utf-8");
}
