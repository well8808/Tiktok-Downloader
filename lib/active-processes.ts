import type { ChildProcess } from "node:child_process";

type Registry = Map<string, ChildProcess>;

const globalForRegistry = globalThis as unknown as {
  activeProcesses?: Registry;
};

export const activeProcesses: Registry =
  globalForRegistry.activeProcesses ?? new Map();

if (process.env.NODE_ENV !== "production") {
  globalForRegistry.activeProcesses = activeProcesses;
}

export function registerProcess(jobId: string, proc: ChildProcess) {
  activeProcesses.set(jobId, proc);
}

export function unregisterProcess(jobId: string) {
  activeProcesses.delete(jobId);
}

export function killProcess(jobId: string): boolean {
  const proc = activeProcesses.get(jobId);
  if (!proc) return false;
  try {
    proc.kill("SIGTERM");
  } catch {
    // ignore
  }
  activeProcesses.delete(jobId);
  return true;
}
