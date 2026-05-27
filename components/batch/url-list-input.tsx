"use client";

import { useState } from "react";
import { parseUrlList } from "@/lib/downloader/url-validator";

type Props = { onSubmit: (text: string) => void; disabled?: boolean };

export function UrlListInput({ onSubmit, disabled }: Props) {
  const [text, setText] = useState("");
  const count = parseUrlList(text).length;
  return (
    <div className="w-full max-w-3xl">
      <h1 className="text-xl font-medium text-text-primary">Cole as URLs</h1>
      <p className="mt-1 text-sm text-text-muted">
        Uma por linha. Até 100 por vez.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={disabled}
        rows={10}
        className="mt-5 w-full rounded-md border border-border bg-surface p-4 font-mono text-sm text-text-primary placeholder:text-text-subtle outline-none focus:border-accent transition-colors resize-y min-h-[200px]"
        placeholder="https://www.tiktok.com/..."
      />
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-text-subtle font-mono">
          {count} URLs detectadas
        </span>
      </div>
      <button
        onClick={() => onSubmit(text)}
        disabled={disabled || count === 0}
        className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-accent border-b-2 border-accent-press px-6 text-sm font-medium text-white hover:brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Iniciar fila
      </button>
    </div>
  );
}
