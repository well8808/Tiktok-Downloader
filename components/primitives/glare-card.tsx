"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

type Props = React.HTMLAttributes<HTMLDivElement> & {
  glareColor?: string;
};

/**
 * GlareCard — card com glare hover estilo Linear.
 * Mouse position se torna gradient radial seguindo o cursor.
 */
export const GlareCard = React.forwardRef<HTMLDivElement, Props>(
  function GlareCard(
    { children, className, glareColor = "263 70% 58%", style, ...rest },
    ref,
  ) {
    const localRef = React.useRef<HTMLDivElement>(null);
    React.useImperativeHandle(ref, () => localRef.current as HTMLDivElement);
    const [pos, setPos] = React.useState<{ x: number; y: number } | null>(null);

    const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
      const el = localRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setPos({
        x: ((e.clientX - rect.left) / rect.width) * 100,
        y: ((e.clientY - rect.top) / rect.height) * 100,
      });
    };
    const handleLeave = () => setPos(null);

    return (
      <div
        ref={localRef}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        style={style}
        className={cn("relative overflow-hidden", className)}
        {...rest}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 transition-opacity duration-200"
          style={{
            opacity: pos ? 1 : 0,
            background: pos
              ? `radial-gradient(560px circle at ${pos.x}% ${pos.y}%, hsl(${glareColor} / 0.18), transparent 45%)`
              : undefined,
          }}
        />
        {/* Light border edge highlight */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-200"
          style={{
            opacity: pos ? 0.5 : 0,
            background: pos
              ? `radial-gradient(180px circle at ${pos.x}% ${pos.y}%, hsl(${glareColor} / 0.25), transparent 40%)`
              : undefined,
            mixBlendMode: "overlay",
          }}
        />
        <div className="relative z-10">{children}</div>
      </div>
    );
  },
);
