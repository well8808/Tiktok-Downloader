"use client";

import { Clock, Video } from "lucide-react";
import { motion } from "framer-motion";
import { Kbd } from "@/components/primitives/kbd";
import { ShimmerButton } from "@/components/primitives/shimmer-button";
import { GlareCard } from "@/components/primitives/glare-card";
import { sound } from "@/lib/sound";
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
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 380,
        damping: 24,
        mass: 0.6,
      }}
      className="w-full max-w-2xl"
    >
    <GlareCard
      className="rounded-md border border-border bg-surface p-5 shadow-lift-strong"
      glareColor="263 70% 60%"
    >
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
      <ShimmerButton
        onClick={() => {
          sound.playPrimary();
          onDownload();
        }}
        className="mt-5 w-full h-11"
      >
        Baixar vídeo
        <Kbd className="bg-white/10 border-white/20 text-white/80">↵</Kbd>
      </ShimmerButton>
      <button
        onClick={() => {
          sound.playPrimary();
          onAudioOnly();
        }}
        className="mt-3 w-full text-center text-sm text-text-muted hover:text-text-primary underline underline-offset-4 transition-colors"
      >
        ou só o áudio (MP3)
      </button>
    </GlareCard>
    </motion.div>
  );
}
