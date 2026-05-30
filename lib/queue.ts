type Task<T> = () => Promise<T>;

export class Queue {
  private running = 0;
  private pending: Array<() => void> = [];

  constructor(private readonly concurrency: number) {}

  async add<T>(task: Task<T>): Promise<T> {
    if (this.running >= this.concurrency) {
      await new Promise<void>((resolve) => this.pending.push(resolve));
    }
    this.running++;
    try {
      return await task();
    } finally {
      this.running--;
      const next = this.pending.shift();
      if (next) next();
    }
  }
}

const globalForQueue = globalThis as unknown as { downloadQueue?: Queue };
export const downloadQueue = globalForQueue.downloadQueue ?? new Queue(2);
// SEMPRE cacheia no globalThis (ver nota em progress-bus.ts) — uma única fila
// real, com a concorrência de fato compartilhada entre bundles.
globalForQueue.downloadQueue = downloadQueue;
