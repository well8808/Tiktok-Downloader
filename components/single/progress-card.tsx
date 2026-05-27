"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FolderOpen, RotateCcw, X, Check } from "lucide-react";
import NumberFlow from "@number-flow/react";
import { ProgressBar } from "@/components/primitives/progress-bar";
import { GlareCard } from "@/components/primitives/glare-card";
import { Sparkles } from "@/components/primitives/sparkles";
import { MultiStepLoader } from "@/components/primitives/multi-step-loader";
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

const STEPS = [
  { label: "Validando link" },
  { label: "Baixando vídeo" },
  { label: "Removendo metadados" },
  { label: "Conferindo arquivo" },
  { label: "Pronto" },
];

function statusToStepIndex(status: JobStatus, percent: number): number {
  if (status === "VALIDATING") return 0;
  if (status === "DOWNLOADING") return 1;
  if (status === "PROCESSING") {
    // PROCESSING tem 2 sub-fases (strip + validate). Quando termina o
    // strip e parte pro validate, percent é 100 (downloaded), e ainda
    // estamos validando. Aproximação: PROCESSING quase sempre = step 2.
    return percent >= 100 ? 3 : 2;
  }
  if (status === "COMPLETED") return STEPS.length;
  return 0;
}

export function ProgressCard({ jobId, info, onRestart }: Props) {
  const [status, setStatus] = useState<JobStatus>("DOWNLOADING");
  const [percent, setPercent] = useState(0);
  const [message, setMessage] = useState<string | undefined>();
  const [filePath, setFilePath] = useState<string | undefined>();
  const terminalSoundRef = useRef(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const prefs = useSoundPrefs();

  useEffect(() => {
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
          let originY = 0.5;
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
  const isCompleted = status === "COMPLETED";
  const isFailed = status === "FAILED";
  const isCancelled = status === "CANCELLED";
  const stepIndex = useMemo(
    () => statusToStepIndex(status, percent),
    [status, percent],
  );

  return (
    <motion.div
      ref={cardRef}
      animate={
        isCompleted
          ? {
              scale: [1, 1.04, 1],
              boxShadow: [
                "0 0 0 0 hsl(150 60% 50% / 0)",
                "0 0 0 10px hsl(150 60% 50% / 0.22), 0 22px 50px -10px hsl(150 60% 50% / 0.5)",
                "0 0 0 0 hsl(150 60% 50% / 0)",
              ],
            }
          : { scale: 1 }
      }
      transition={
        isCompleted
          ? { duration: 1.4, ease: [0.25, 0.46, 0.45, 0.94] }
          : { duration: 0.2 }
      }
      className="w-full max-w-2xl"
    >
      <GlareCard
        className={cn(
          "rounded-md border bg-surface p-5 transition-colors duration-300",
          isCompleted
            ? "border-success/45"
            : isFailed
              ? "border-danger/40"
              : "border-border",
        )}
        glareColor={isCompleted ? "150 60% 55%" : "263 70% 60%"}
      >
        {/* Sparkles overlay no completion */}
        {isCompleted && (
          <Sparkles count={14} color="hsl(150 60% 60%)" size={3} />
        )}

        <div className="flex gap-4">
          {info.thumbnailUrl && (
            <motion.div
              animate={
                isCompleted
                  ? { scale: [1, 1.08, 1] }
                  : { scale: 1 }
              }
              transition={{ duration: 0.7, delay: 0.1 }}
              className="relative"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={info.thumbnailUrl}
                alt=""
                className={cn(
                  "h-[54px] w-[96px] rounded-sm object-cover border transition-all duration-300",
                  isCompleted
                    ? "border-success/45 shadow-[0_0_22px_-2px_hsl(150_60%_50%/0.55)]"
                    : "border-border",
                )}
              />
            </motion.div>
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

        {/* Multi step loader visível durante o processo */}
        {!isCompleted && !isFailed && !isCancelled && (
          <div className="mt-5">
            <MultiStepLoader
              steps={STEPS}
              currentIndex={stepIndex}
              done={false}
            />
          </div>
        )}

        {/* Counter + progress bar */}
        {(status === "DOWNLOADING" || status === "PROCESSING") && (
          <div className="mt-4 flex items-center justify-between font-mono text-sm">
            <span className="text-text-muted">
              {status === "DOWNLOADING" ? "Baixando" : "Processando"}
            </span>
            <NumberFlow
              value={Math.floor(percent)}
              suffix="%"
              className="text-text-primary tabular-nums"
              transformTiming={{
                duration: 360,
                easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
              }}
            />
          </div>
        )}

        <ProgressBar
          percent={percent}
          variant={variant}
          shimmer={status === "DOWNLOADING" || status === "PROCESSING"}
          className="mt-3"
        />

        {/* Completion big check + label */}
        <AnimatePresence>
          {isCompleted && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.3 }}
              className="mt-5 flex items-center gap-3"
            >
              <motion.span
                initial={{ scale: 0.3, rotate: -90, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 360,
                  damping: 16,
                  delay: 0.1,
                }}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-success/15 text-success"
              >
                <Check size={20} strokeWidth={3} />
              </motion.span>
              <div>
                <p className="text-base font-medium text-text-primary">
                  Pronto
                </p>
                <p className="font-mono text-xs text-text-subtle">
                  Arquivo limpo e salvo
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {(status === "DOWNLOADING" ||
          status === "PROCESSING" ||
          status === "VALIDATING") && (
          <div className="mt-5">
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

        {isCancelled && (
          <div className="mt-5 space-y-2">
            <p className="text-sm text-text-muted">
              {message ?? "Download cancelado"}
            </p>
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
            transition={{ delay: 0.55, duration: 0.3 }}
            className="mt-5 flex items-center gap-4 text-sm"
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

        {isFailed && (
          <div className="mt-5 space-y-2">
            <p className="text-sm text-danger">
              {message ?? "Algo deu errado"}
            </p>
            <button
              onClick={onRestart}
              className="text-sm text-text-muted hover:text-text-primary underline underline-offset-4"
            >
              Tentar de novo
            </button>
          </div>
        )}
      </GlareCard>
    </motion.div>
  );
}
