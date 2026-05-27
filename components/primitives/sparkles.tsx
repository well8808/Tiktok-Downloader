"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

type Props = {
  count?: number;
  color?: string;
  size?: number;
  className?: string;
};

/**
 * Sparkles — decorativo. Pontos brilhantes animados num overlay.
 * Mais leve que tsParticles, ideal pra background sutil em moments.
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
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className ?? ""}`}
    >
      {sparks.map((s) => (
        <motion.span
          key={s.id}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: [0, 1, 0], scale: [0.5, 1.1, 0.5] }}
          transition={{
            duration: s.duration,
            delay: s.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute rounded-full"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: `${size * s.sizeMul}px`,
            height: `${size * s.sizeMul}px`,
            background: color,
            boxShadow: `0 0 ${size * 3}px ${color}`,
          }}
        />
      ))}
    </div>
  );
}
