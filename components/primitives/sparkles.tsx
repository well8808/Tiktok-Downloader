"use client";

import { useMemo } from "react";
import { cn } from "@/lib/cn";

type Props = {
  count?: number;
  color?: string;
  size?: number;
  className?: string;
};

/**
 * Sparkles — decorativo.
 *
 * 60fps target: CSS animation pura (keyframes spark-twinkle).
 * transform + opacity only. will-change pra GPU promotion.
 */
export function Sparkles({
  count = 12,
  color = "hsl(150 60% 60%)",
  size = 3,
  className,
}: Props) {
  const sparks = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 2.4,
      duration: 1.6 + Math.random() * 1.2,
      sizeMul: 0.6 + Math.random() * 0.8,
    }));
  }, [count]);

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
      style={{ contain: "layout paint" }}
    >
      {sparks.map((s) => (
        <span
          key={s.id}
          className="absolute rounded-full animate-spark-twinkle"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: `${size * s.sizeMul}px`,
            height: `${size * s.sizeMul}px`,
            background: color,
            boxShadow: `0 0 ${size * 3}px ${color}`,
            animationDelay: `${s.delay.toFixed(2)}s`,
            animationDuration: `${s.duration.toFixed(2)}s`,
            willChange: "transform, opacity",
          }}
        />
      ))}
    </div>
  );
}
