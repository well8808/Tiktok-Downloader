"use client";

import { Clock, Video } from "lucide-react";
import { Kbd } from "@/components/primitives/kbd";
import type { VideoInfo } from "@/lib/downloader/types";

type Props = {
  info: VideoInfo;
  onDownload: () => void;
  onAudioOnly: () => void;
};

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function PreviewCard({ info, onDownload, onAudioOnly }: Props) {
  return (
    <div className="w-full max-w-2xl rounded-md border border-border bg-surface p-5">
      <div className="flex gap-4">
        {info.thumbnailUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={info.thumbnailUrl}
            alt=""
            className="h-[54px] w-[96px] rounded-sm object-cover border border-border"
          />
        ) : (
          <div className="h-[54px] w-[96px] rounded-sm bg-surface-hover border border-border" />
        )}
        <div className="min-w-0 flex-1">
          <p className="font-mono text-sm text-text-primary truncate">
            {info.authorHandle}
          </p>
          <p className="mt-1 text-sm text-text-muted line-clamp-2">
            {info.title}
          </p>
          <div className="mt-2 flex items-center gap-3 text-xs text-text-subtle font-mono">
            <span className="inline-flex items-center gap-1">
              <Clock size={12} />
              {formatDuration(info.durationSec)}
            </span>
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              <Video size={12} />
              MP4
            </span>
          </div>
        </div>
      </div>
      <button
        onClick={onDownload}
        className="mt-5 w-full inline-flex h-11 items-center justify-center gap-2 rounded-md bg-accent border-b-2 border-accent-press text-sm font-medium text-white hover:brightness-110 hover:-translate-y-px hover:shadow-lift active:translate-y-0 active:brightness-95 transition duration-150 ease-out-quad focus-visible:outline-none focus-visible:shadow-focus-ring"
      >
        Baixar vídeo
        <Kbd className="bg-white/10 border-white/20 text-white/80">↵</Kbd>
      </button>
      <button
        onClick={onAudioOnly}
        className="mt-3 w-full text-center text-sm text-text-muted hover:text-text-primary underline underline-offset-4 transition-colors"
      >
        ou só o áudio (MP3)
      </button>
    </div>
  );
}
