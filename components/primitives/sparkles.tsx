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
 * 60fps target: CSS pure keyframes (spark-twinkle em globals.css).
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
          className="spark-dot absolute rounded-full"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: `${size * s.sizeMul}px`,
            height: `${size * s.sizeMul}px`,
            background: color,
            boxShadow: `0 0 ${size * 3}px ${color}`,
            animationDelay: `-${s.delay.toFixed(2)}s`,
          }}
        />
      ))}
    </div>
  );
}
