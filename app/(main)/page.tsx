"use client";

import { useState } from "react";
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

export default function SinglePage() {
  const [stage, setStage] = useState<Stage>({ kind: "input" });

  const reset = () => setStage({ kind: "input" });

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      {stage.kind === "input" && (
        <UrlInput
          onProbed={(jobId, info) =>
            setStage({ kind: "preview", jobId, info })
          }
          onError={(message) => setStage({ kind: "error", message })}
        />
      )}
      {stage.kind === "preview" && (
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
      )}
      {stage.kind === "progress" && (
        <ProgressCard jobId={stage.jobId} info={stage.info} onRestart={reset} />
      )}
      {stage.kind === "error" && (
        <div className="w-full max-w-2xl rounded-md border border-danger/30 bg-surface p-5">
          <p className="text-sm text-text-primary">{stage.message}</p>
          <button
            onClick={reset}
            className="mt-3 text-sm text-text-muted hover:text-text-primary underline underline-offset-4"
          >
            Tentar outra URL
          </button>
        </div>
      )}
    </div>
  );
}
