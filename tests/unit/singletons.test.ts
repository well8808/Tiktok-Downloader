import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * Regressão do bug "trava em baixando no app empacotado".
 *
 * O Next.js compila a rota SSE (route.js) e as Server Actions (page.js)
 * em bundles SEPARADOS. Cada bundle reavalia lib/progress-bus.ts, então
 * sem um cache em globalThis cada um cria seu PRÓPRIO EventEmitter. Aí o
 * orquestrador emite numa instância e a rota SSE escuta em outra — o
 * navegador nunca recebe "COMPLETED" e a UI trava em "baixando".
 *
 * O cache em globalThis só era escrito quando NODE_ENV !== "production".
 * No .exe o Next roda em produção, então o cache nunca era populado.
 *
 * Estes testes simulam dois bundles (dois resetModules) sob NODE_ENV
 * "production" e exigem UMA instância compartilhada.
 */

const SINGLETONS = [
  { name: "progress-bus", path: "@/lib/progress-bus", key: "progressBus" },
  { name: "active-processes", path: "@/lib/active-processes", key: "activeProcesses" },
  { name: "queue", path: "@/lib/queue", key: "downloadQueue" },
] as const;

describe("cross-bundle singletons compartilham instância em produção", () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.resetModules();
    // Simula o app empacotado (Electron roda Next com dev:false → production)
    (process.env as Record<string, string>).NODE_ENV = "production";
    for (const s of SINGLETONS) delete (globalThis as Record<string, unknown>)[s.key];
  });

  afterEach(() => {
    (process.env as Record<string, string>).NODE_ENV = originalEnv ?? "test";
    for (const s of SINGLETONS) delete (globalThis as Record<string, unknown>)[s.key];
  });

  for (const s of SINGLETONS) {
    it(`${s.name}: registra a instância no globalThis mesmo em produção`, async () => {
      const mod = (await import(s.path)) as Record<string, unknown>;
      expect((globalThis as Record<string, unknown>)[s.key]).toBe(mod[s.key]);
    });

    it(`${s.name}: dois bundles distintos recebem a MESMA instância`, async () => {
      const first = (await import(s.path)) as Record<string, unknown>;
      vi.resetModules(); // segundo bundle reavalia o módulo
      const second = (await import(s.path)) as Record<string, unknown>;
      expect(second[s.key]).toBe(first[s.key]);
    });
  }
});
