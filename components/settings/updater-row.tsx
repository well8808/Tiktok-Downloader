"use client";

import { useState, useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { checkUpdate } from "@/app/actions/config";

export function UpdaterRow({ version }: { version: string }) {
  const [current, setCurrent] = useState(version);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-6">
      <div className="flex-1 grid grid-cols-2 gap-2 text-sm">
        <span className="text-text-muted">Versão local</span>
        <span className="font-mono text-text-primary">{current}</span>
      </div>
      <button
        disabled={pending}
        onClick={() =>
          start(async () => {
            try {
              const r = await checkUpdate();
              setCurrent(r.version);
              setMsg(
                r.updated
                  ? `Atualizado para ${r.version}`
                  : "Já está na última versão",
              );
            } catch {
              setMsg("Falha ao verificar (sem internet?)");
            }
          })
        }
        className="h-10 inline-flex items-center gap-2 rounded-md border border-border px-3 text-sm text-text-primary hover:bg-surface transition-colors disabled:opacity-50"
      >
        <RefreshCw size={14} className={pending ? "animate-spin" : undefined} />
        Verificar atualização
      </button>
      {msg && <p className="text-xs text-text-muted">{msg}</p>}
    </div>
  );
}
