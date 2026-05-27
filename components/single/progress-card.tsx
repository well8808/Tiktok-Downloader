"use client";

import { useEffect, useRef, useState } from "react";
import { FolderOpen, RotateCcw, X } from "lucide-react";
import { ProgressBar } from "@/components/primitives/progress-bar";
import { StatusIcon } from "@/components/primitives/status-icon";
import { cancelJob } from "@/app/actions/cancel";
import { sound } from "@/lib/sound";
import { fireCompletionConfetti } from "@/lib/confetti";
import {
  usePrefersReducedMotion,
  useSoundPrefs,
} from "@/lib/use-sound";
import type { JobStatus, VideoInfo } from "@/lib/downloader/types";

type Props = {
  jobId: string;
  info: VideoInfo;
  onRestart: () => void;
};

const STATUS_LABEL: Record<JobStatus, string> = {
  PENDING: "Na fila",
  VALIDATING: "Validando",
  DOWNLOADING: "Baixando",
  PROCESSING: "Processando",
  COMPLETED: "Pronto",
  FAILED: "Falhou",
  CANCELLED: "Cancelado",
};

export function ProgressCard({ jobId, info, onRestart }: Props) {
  const [status, setStatus] = useState<JobStatus>("DOWNLOADING");
  const [percent, setPercent] = useState(0);
  const [message, setMessage] = useState<string | undefined>();
  const [filePath, setFilePath] = useState<string | undefined>();
  const startedRef = useRef(false);
  const startedSoundRef = useRef(false);
  const terminalSoundRef = useRef(false);
  const reducedMotion = usePrefersReducedMotion();
  const prefs = useSoundPrefs();

  useEffect(() => {
    if (!startedSoundRef.current) {
      startedSoundRef.current = true;
      sound.playStarted();
    }
    const es = new EventSource(`/api/progress/${jobId}`);
    es.addEventListener("progress", (e: MessageEvent) => {
      const data = JSON.parse(e.data);
      setStatus(data.status);
      setPercent(data.percent);
      setMessage(data.message);
    });
    es.addEventListener("done", (e: MessageEvent) => {
      const data = JSON.parse(e.data);
      setStatus(data.status);
      setPercent(100);
      setMessage(data.message);
      if (data.filePath) setFilePath(data.filePath);

      if (!terminalSoundRef.current) {
        terminalSoundRef.current = true;
        if (data.status === "COMPLETED") {
          window.setTimeout(() => {
            void fireCompletionConfetti({
              enabled: prefs.confettiEnabled,
              reducedMotion,
            });
          }, 80);
          window.setTimeout(() => sound.playComplete(), 100);
        } else if (data.status === "FAILED") {
          sound.playError();
        } else if (data.status === "CANCELLED") {
          sound.playCancel();
        }
      }
      es.close();
    });
    es.onerror = () => es.close();
    return () => es.close();
  }, [jobId, prefs.confettiEnabled, reducedMotion]);

  // Mark started ref to avoid double-fire on hot reload
  if (!startedRef.current) startedRef.current = true;

  const variant =
    status === "COMPLETED"
      ? "success"
      : status === "FAILED"
        ? "danger"
        : "default";
  const displayMessage = message ?? STATUS_LABEL[status];

  return (
    <div className="w-full max-w-2xl rounded-md border border-border bg-surface p-5">
      <div className="flex gap-4">
        {info.thumbnailUrl && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={info.thumbnailUrl}
            alt=""
            className="h-[54px] w-[96px] rounded-sm object-cover border border-border"
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="font-mono text-sm text-text-primary truncate">
            {info.authorHandle}
          </p>
          <p className="mt-1 text-sm text-text-muted line-clamp-2">
            {info.title}
          </p>
        </div>
      </div>
      <div className="mt-5 flex items-center gap-2 text-sm">
        <StatusIcon status={status} size={16} />
        <span className="font-mono text-text-primary">
          {displayMessage}
          {status === "DOWNLOADING" && (
            <span className="ml-2 text-text-muted">{percent.toFixed(0)}%</span>
          )}
        </span>
      </div>
      <ProgressBar
        percent={percent}
        variant={variant}
        shimmer={status === "DOWNLOADING" || status === "PROCESSING"}
        className="mt-3"
      />
      {(status === "DOWNLOADING" ||
        status === "PROCESSING" ||
        status === "VALIDATING") && (
        <div className="mt-4">
          <button
            onClick={() => {
              sound.playCancel();
              void cancelJob(jobId);
            }}
            className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-danger transition-colors"
          >
            <X size={14} /> Cancelar
          </button>
        </div>
      )}
      {status === "CANCELLED" && (
        <div className="mt-4">
          <button
            onClick={onRestart}
            className="text-sm text-text-muted hover:text-text-primary underline underline-offset-4"
          >
            Tentar de novo
          </button>
        </div>
      )}
      {status === "COMPLETED" && (
        <div className="mt-4 flex items-center gap-4 text-sm">
          {filePath && (
            <button
              onClick={() =>
                fetch(`/api/open?path=${encodeURIComponent(filePath)}`, {
                  method: "POST",
                })
              }
              className="inline-flex items-center gap-1.5 text-text-muted hover:text-text-primary transition-colors"
            >
              <FolderOpen size={14} /> Abrir pasta
            </button>
          )}
          <button
            onClick={onRestart}
            className="inline-flex items-center gap-1.5 text-text-muted hover:text-text-primary transition-colors"
          >
            <RotateCcw size={14} /> Baixar outro
          </button>
        </div>
      )}
      {status === "FAILED" && (
        <div className="mt-4 flex items-center gap-4">
          <button
            onClick={onRestart}
            className="text-sm text-text-muted hover:text-text-primary underline underline-offset-4"
          >
            Tentar de novo
          </button>
        </div>
      )}
    </div>
  );
}
