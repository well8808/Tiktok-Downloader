"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { Link as LinkIcon, Loader2 } from "lucide-react";
import { Kbd } from "@/components/primitives/kbd";
import { probeUrl } from "@/app/actions/probe";
import type { VideoInfo } from "@/lib/downloader/types";

type Props = {
  onProbed: (jobId: string, info: VideoInfo) => void;
  onError: (message: string) => void;
};

export function UrlInput({ onProbed, onError }: Props) {
  const [url, setUrl] = useState("");
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  const submit = () => {
    if (!url.trim()) return;
    startTransition(async () => {
      const result = await probeUrl(url.trim());
      if (result.ok) onProbed(result.jobId, result.info);
      else onError(result.message);
    });
  };

  return (
    <div className="w-full max-w-2xl">
      <h1 className="text-xl font-medium text-text-primary">
        Cole um link do TikTok
      </h1>
      <p className="mt-1 text-sm text-text-muted font-mono">
        tiktok.com/@autor/video/...
      </p>
      <div className="mt-5 flex items-center gap-3 rounded-md border border-border bg-surface px-4 h-12 focus-within:border-accent focus-within:shadow-focus-ring transition-all duration-200 ease-out-quad">
        {pending ? (
          <Loader2 size={16} className="text-text-muted animate-spin" />
        ) : (
          <LinkIcon size={16} className="text-text-subtle" />
        )}
        <input
          ref={ref}
          type="text"
          value={url}
          disabled={pending}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="https://..."
          className="flex-1 bg-transparent font-mono text-sm text-text-primary placeholder:text-text-subtle outline-none"
        />
        <Kbd>⌘V</Kbd>
      </div>
      {pending && (
        <p className="mt-3 text-sm text-text-muted">Verificando vídeo...</p>
      )}
    </div>
  );
}
