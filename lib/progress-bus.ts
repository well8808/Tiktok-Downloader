import { EventEmitter } from "node:events";
import type { JobProgress } from "./downloader/types";

class ProgressBus extends EventEmitter {
  emitProgress(progress: JobProgress) {
    this.emit(progress.jobId, progress);
    this.emit("all", progress);
  }
}

const globalForBus = globalThis as unknown as { progressBus?: ProgressBus };
export const progressBus = globalForBus.progressBus ?? new ProgressBus();
progressBus.setMaxListeners(50);
if (process.env.NODE_ENV !== "production") globalForBus.progressBus = progressBus;
