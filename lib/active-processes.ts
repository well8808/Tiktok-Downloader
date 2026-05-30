import { spawn, type ChildProcess } from "node:child_process";

type Registry = Map<string, ChildProcess>;

const globalForRegistry = globalThis as unknown as {
  activeProcesses?: Registry;
};

export const activeProcesses: Registry =
  globalForRegistry.activeProcesses ?? new Map();

// SEMPRE cacheia no globalThis (ver nota em progress-bus.ts). Se o registro
// for duplicado entre bundles, registerProcess (download) e killProcess
// (cancelar) usariam Maps diferentes — o cancelar nunca acharia o processo.
globalForRegistry.activeProcesses = activeProcesses;

export function registerProcess(jobId: string, proc: ChildProcess) {
  activeProcesses.set(jobId, proc);
}

export function unregisterProcess(jobId: string) {
  activeProcesses.delete(jobId);
}

export function killProcess(jobId: string): boolean {
  const proc = activeProcesses.get(jobId);
  if (!proc) return false;
  // No Windows, proc.kill() não mata a árvore — o yt-dlp spawna ffmpeg
  // como filho, que fica órfão e continua processando. taskkill /T mata
  // a árvore inteira; /F força.
  if (process.platform === "win32" && proc.pid) {
    try {
      spawn("taskkill", ["/pid", String(proc.pid), "/T", "/F"], {
        stdio: "ignore",
      });
    } catch {
      try {
        proc.kill();
      } catch {
        // ignore
      }
    }
  } else {
    try {
      proc.kill("SIGTERM");
    } catch {
      // ignore
    }
  }
  activeProcesses.delete(jobId);
  return true;
}
