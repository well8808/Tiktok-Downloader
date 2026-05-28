"use client";

import { useMemo } from "react";
import { cn } from "@/lib/cn";

type Props = {
  /** Quantidade de barras. Default 56. */
  bars?: number;
  /** Estado ativo (pending) — intensifica altura e opacity. */
  active?: boolean;
  className?: string;
};

/**
 * WaveformAmbient — ondas verticais abaixo do input.
 *
 * 60fps target: usa CSS animation pura (keyframes wave-pulse) em vez de
 * 56 instâncias Framer Motion. Browser promove cada barra pra layer
 * própria via `will-change: transform`. transform-only = compositor-only
 * = sem layout/paint cost por frame.
 *
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
        const distFromCenter = Math.abs(i - center) / center; // 0..1
        const envelope = 1 - Math.pow(distFromCenter, 1.6);
        const random = 0.4 + Math.random() * 0.6;
        const baseHeight = Math.max(4, Math.round(envelope * random * 38));
        const delay = (Math.abs(i - center) / center) * 0.6 + Math.random() * 0.4;
        return { id: i, baseHeight, delay };
      }),
    [bars],
  );

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none flex h-12 items-end justify-center gap-[3px] transition-opacity duration-500",
        active ? "opacity-60" : "opacity-25",
        className,
      )}
      style={{ contain: "layout paint" }}
    >
      {items.map((b) => (
        <span
          key={b.id}
          className={cn(
            "block w-[2px] rounded-full bg-accent",
            active ? "animate-wave-pulse-active" : "animate-wave-pulse",
          )}
          style={{
            height: `${b.baseHeight}px`,
            transformOrigin: "bottom",
            willChange: "transform",
            animationDelay: `${b.delay.toFixed(2)}s`,
          }}
        />
      ))}
    </div>
  );
}
