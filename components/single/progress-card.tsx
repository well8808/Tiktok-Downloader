"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FolderOpen, RotateCcw, X, Check } from "lucide-react";
import { ProgressBar } from "@/components/primitives/progress-bar";
import { StatusIcon } from "@/components/primitives/status-icon";
import { cancelJob } from "@/app/actions/cancel";
import { sound } from "@/lib/sound";
import { fireCompletionConfetti } from "@/lib/confetti";
import {
  usePrefersReducedMotion,
  useSoundPrefs,
} from "@/lib/use-sound";
import { cn } from "@/lib/cn";
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
  const startedSoundRef = useRef(false);
  const terminalSoundRef = useRef(false);
  const cardRef = useRef<HTMLDivElement>(null);
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
          let originX = 0.5;
          let originY = 0.42;
          if (cardRef.current) {
            const rect = cardRef.current.getBoundingClientRect();
            originX = (rect.left + rect.width / 2) / window.innerWidth;
            originY = (rect.top + rect.height / 2) / window.innerHeight;
          }
          window.setTimeout(() => {
            void fireCompletionConfetti({
              enabled: prefs.confettiEnabled,
              reducedMotion,
              originX,
              originY,
            });
          }, 60);
          window.setTimeout(() => sound.playComplete(), 90);
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

  const variant =
    status === "COMPLETED"
      ? "success"
      : status === "FAILED"
        ? "danger"
        : "default";
  const displayMessage = message ?? STATUS_LABEL[status];
  const isCompleted = status === "COMPLETED";

  return (
    <motion.div
      ref={cardRef}
      animate={
        isCompleted
          ? {
              scale: [1, 1.035, 1],
              boxShadow: [
                "0 0 0 0 hsl(150 60% 50% / 0)",
                "0 0 0 8px hsl(150 60% 50% / 0.18), 0 16px 40px -10px hsl(150 60% 50% / 0.4)",
                "0 0 0 0 hsl(150 60% 50% / 0)",
              ],
            }
          : { scale: 1 }
      }
      transition={
        isCompleted
          ? { duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }
          : { duration: 0.2 }
      }
      className={cn(
        "relative w-full max-w-2xl rounded-md border bg-surface p-5 transition-colors duration-300",
        isCompleted
          ? "border-success/40"
          : status === "FAILED"
            ? "border-danger/30"
            : "border-border",
      )}
    >
      {/* Ring de partículas decorativo no completion */}
      <AnimatePresence>
        {isCompleted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: [0, 1, 0], scale: [0.6, 1.6, 2.2] }}
            transition={{ duration: 1.4, ease: "easeOut" }}
            className="pointer-events-none absolute left-5 top-5 h-10 w-10 rounded-full border-2 border-success/40"
            aria-hidden
          />
        )}
      </AnimatePresence>

      <div className="flex gap-4">
        {info.thumbnailUrl && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={info.thumbnailUrl}
            alt=""
            className={cn(
              "h-[54px] w-[96px] rounded-sm object-cover border transition-all duration-300",
              isCompleted
                ? "border-success/40 shadow-[0_0_18px_-2px_hsl(150_60%_50%/0.45)]"
                : "border-border",
            )}
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
        <AnimatePresence mode="wait">
          {isCompleted ? (
            <motion.span
              key="check"
              initial={{ scale: 0.4, rotate: -90, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 380, damping: 16 }}
              className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-success/15 text-success"
            >
              <Check size={14} strokeWidth={3} />
            </motion.span>
          ) : (
            <motion.span
              key="status"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <StatusIcon status={status} size={16} />
            </motion.span>
          )}
        </AnimatePresence>
        <span className="font-mono text-text-primary">
          {displayMessage}
          {status === "DOWNLOADING" && (
            <motion.span
              key={Math.floor(percent / 10)}
              initial={{ opacity: 0, y: -2 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.12 }}
              className="ml-2 text-text-muted"
            >
              {percent.toFixed(0)}%
            </motion.span>
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

      {isCompleted && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.3 }}
          className="mt-4 flex items-center gap-4 text-sm"
        >
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
        </motion.div>
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
    </motion.div>
  );
}
