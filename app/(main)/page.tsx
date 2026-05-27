"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { UrlInput } from "@/components/single/url-input";
import { PreviewCard } from "@/components/single/preview-card";
import { ProgressCard } from "@/components/single/progress-card";
import { startDownload } from "@/app/actions/download";
import type { VideoInfo } from "@/lib/downloader/types";

type Stage =
  | { kind: "input" }
  | { kind: "preview"; jobId: string; info: VideoInfo }
  | { kind: "progress"; jobId: string; info: VideoInfo }
  | { kind: "error"; message: string };

const stageTransition = {
  duration: 0.24,
  ease: [0.25, 0.46, 0.45, 0.94] as const,
};

export default function SinglePage() {
  const [stage, setStage] = useState<Stage>({ kind: "input" });
  const reset = () => setStage({ kind: "input" });

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <AnimatePresence mode="wait" initial={false}>
        {stage.kind === "input" && (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={stageTransition}
            className="w-full flex justify-center"
          >
            <UrlInput
              onProbed={(jobId, info) =>
                setStage({ kind: "preview", jobId, info })
              }
              onError={(message) => setStage({ kind: "error", message })}
            />
          </motion.div>
        )}
        {stage.kind === "preview" && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={stageTransition}
            className="w-full flex justify-center"
          >
            <PreviewCard
              info={stage.info}
              onDownload={() => {
                startDownload(stage.jobId, {});
                setStage({
                  kind: "progress",
                  jobId: stage.jobId,
                  info: stage.info,
                });
              }}
              onAudioOnly={() => {
                startDownload(stage.jobId, { extractMp3: true });
                setStage({
                  kind: "progress",
                  jobId: stage.jobId,
                  info: stage.info,
                });
              }}
            />
          </motion.div>
        )}
        {stage.kind === "progress" && (
          <motion.div
            key="progress"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={stageTransition}
            className="w-full flex justify-center"
          >
            <ProgressCard
              jobId={stage.jobId}
              info={stage.info}
              onRestart={reset}
            />
          </motion.div>
        )}
        {stage.kind === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={stageTransition}
            className="w-full flex justify-center"
          >
            <div className="w-full max-w-2xl rounded-md border border-danger/30 bg-surface p-5">
              <p className="text-sm text-text-primary">{stage.message}</p>
              <button
                onClick={reset}
                className="mt-3 text-sm text-text-muted hover:text-text-primary underline underline-offset-4"
              >
                Tentar outra URL
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
