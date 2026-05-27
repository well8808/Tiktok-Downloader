"use client";

import { useState } from "react";
import { parseUrlList } from "@/lib/downloader/url-validator";
import { sound } from "@/lib/sound";
import { ShimmerButton } from "@/components/primitives/shimmer-button";

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
        className="mt-5 w-full rounded-md border border-border bg-surface p-4 font-mono text-sm text-text-primary placeholder:text-text-subtle outline-none focus:border-accent focus:shadow-focus-ring transition-all duration-200 ease-out-quad resize-y min-h-[200px]"
        placeholder="https://www.tiktok.com/..."
      />
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-text-subtle font-mono">
          {count} URLs detectadas
        </span>
      </div>
      <ShimmerButton
        onClick={() => {
          sound.playPrimary();
          onSubmit(text);
        }}
        disabled={disabled || count === 0}
        className="mt-4 h-11 px-6"
      >
        Iniciar fila
      </ShimmerButton>
    </div>
  );
}
