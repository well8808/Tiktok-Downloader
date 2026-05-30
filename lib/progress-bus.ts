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
// SEMPRE cacheia no globalThis — inclusive em produção. O Next.js compila a
// rota SSE (route.js) e as Server Actions (page.js) em bundles separados, e
// cada um reavalia este módulo. Sem este cache global, cada bundle cria seu
// próprio EventEmitter: o orquestrador emite num, a rota SSE escuta noutro, e
// o navegador nunca recebe "COMPLETED" (UI trava em "baixando"). NÃO voltar a
// gatear por NODE_ENV — isso reintroduz o bug só no app empacotado.
globalForBus.progressBus = progressBus;
