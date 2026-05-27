"use client";

import { useState, useTransition, useRef, useEffect, useCallback } from "react";
import { Link as LinkIcon, Loader2 } from "lucide-react";
import { Kbd } from "@/components/primitives/kbd";
import { probeUrl } from "@/app/actions/probe";
import { sound } from "@/lib/sound";
import { fireProbeSparkle } from "@/lib/confetti";
import { usePrefersReducedMotion, useSoundPrefs } from "@/lib/use-sound";
import type { VideoInfo } from "@/lib/downloader/types";

type Props = {
  onProbed: (jobId: string, info: VideoInfo) => void;
  onError: (message: string) => void;
};

export function UrlInput({ onProbed, onError }: Props) {
  const [url, setUrl] = useState("");
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLInputElement>(null);
  const inputBoxRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const prefs = useSoundPrefs();

  const runProbe = useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed) return;
      startTransition(async () => {
        const result = await probeUrl(trimmed);
        if (result.ok) {
          sound.playProbeSuccess();
          let originX = 0.5;
          let originY = 0.48;
          if (inputBoxRef.current) {
            const rect = inputBoxRef.current.getBoundingClientRect();
            originX = (rect.left + rect.width / 2) / window.innerWidth;
            originY = (rect.top + rect.height / 2) / window.innerHeight;
          }
          void fireProbeSparkle({
            enabled: prefs.confettiEnabled,
            reducedMotion,
            originX,
            originY,
          });
          onProbed(result.jobId, result.info);
        } else {
          sound.playError();
          onError(result.message);
        }
      });
    },
    [onProbed, onError, prefs.confettiEnabled, reducedMotion],
  );

  useEffect(() => {
    ref.current?.focus();
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (!detail) return;
      setUrl(detail);
      runProbe(detail);
    };
    window.addEventListener("ttdl:paste-url", handler);
    return () => window.removeEventListener("ttdl:paste-url", handler);
  }, [runProbe]);

  const submit = () => runProbe(url);

  return (
    <div className="w-full max-w-2xl">
      <h1 className="text-xl font-medium text-text-primary">
        Cole um link do TikTok
      </h1>
      <p className="mt-1 text-sm text-text-muted font-mono">
        tiktok.com/@autor/video/...
      </p>
      <div
        ref={inputBoxRef}
        className="mt-5 flex items-center gap-3 rounded-md border border-border bg-surface px-4 h-12 focus-within:border-accent focus-within:shadow-focus-ring-strong focus-within:bg-surface-hover transition-all duration-200 ease-out-quad"
      >
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
