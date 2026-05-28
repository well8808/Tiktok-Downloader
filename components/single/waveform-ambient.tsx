"use client";

import { useMemo } from "react";
import { cn } from "@/lib/cn";

type Props = {
  /** Quantidade de barras. Default 56. */
  bars?: number;
  /** Estado ativo (pending) — intensifica altura e frequência. */
  active?: boolean;
  className?: string;
};

/**
 * WaveformAmbient — ondas verticais abaixo do input.
 *
 * 60fps target: CSS pure keyframes (definidos em globals.css), compositor-only.
 * Cada barra tem delay inline diferente pra criar fase visual sem
 * recalculo de runtime.
 */
export function WaveformAmbient({
  bars = 56,
  active = false,
  className,
}: Props) {
  const items = useMemo(
    () =>
      Array.from({ length: bars }, (_, i) => {
        const center = (bars - 1) / 2;
        const distFromCenter = Math.abs(i - center) / center;
        const envelope = 1 - Math.pow(distFromCenter, 1.6);
        const random = 0.4 + Math.random() * 0.6;
        const baseHeight = Math.max(4, Math.round(envelope * random * 38));
        const delay = (i / bars) * 1.2 + Math.random() * 0.3;
        return { id: i, baseHeight, delay };
      }),
    [bars],
  );

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none flex h-12 items-end justify-center gap-[3px] transition-opacity duration-500",
        active ? "opacity-70" : "opacity-35",
        className,
      )}
      style={{ contain: "layout paint" }}
    >
      {items.map((b) => (
        <span
          key={b.id}
          className={cn(
            "block w-[2px] rounded-full bg-accent",
            active ? "wave-bar-active" : "wave-bar",
          )}
          style={{
            height: `${b.baseHeight}px`,
            animationDelay: `-${b.delay.toFixed(2)}s`,
          }}
        />
      ))}
    </div>
  );
}
