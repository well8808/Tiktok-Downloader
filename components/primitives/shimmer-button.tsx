"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  shimmerColor?: string;
  background?: string;
  borderColor?: string;
};

/**
 * ShimmerButton — botão com shimmer constante percorrendo a borda.
 * Inspirado no Magic UI shimmer-button mas leve.
 */
export const ShimmerButton = React.forwardRef<HTMLButtonElement, Props>(
  function ShimmerButton(
    {
      children,
      className,
      shimmerColor = "rgba(255,255,255,0.85)",
      background = "hsl(263 70% 58%)",
      borderColor = "hsl(263 70% 48%)",
      style,
      ...rest
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        {...rest}
        style={
          {
            "--shimmer-color": shimmerColor,
            background,
            borderColor,
            ...style,
          } as React.CSSProperties
        }
        className={cn(
          "group relative overflow-hidden inline-flex items-center justify-center",
          "rounded-md border-b-2 text-sm font-medium text-white",
          "transition-all duration-200 ease-out-quad",
          "hover:brightness-110 hover:-translate-y-[3px] hover:shadow-lift-strong",
          "active:translate-y-0 active:scale-[0.97] active:brightness-95",
          "focus-visible:outline-none focus-visible:shadow-focus-ring-strong",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none",
          className,
        )}
      >
        {/* Shimmer overlay */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -translate-x-full
                     bg-gradient-to-r from-transparent via-[var(--shimmer-color)] to-transparent
                     opacity-40 mix-blend-overlay
                     animate-[shimmer-travel_2.6s_cubic-bezier(0.25,0.46,0.45,0.94)_infinite]"
          style={{ width: "60%", willChange: "transform" }}
        />
        {/* Highlight superior sutil */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px
                     bg-gradient-to-r from-transparent via-white/40 to-transparent"
        />
        <span className="relative z-10 inline-flex items-center justify-center gap-2">
          {children}
        </span>
      </button>
    );
  },
);
