"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/cn";

type Side = "right" | "top" | "bottom" | "left";

type Props = {
  label: string;
  side?: Side;
  delayMs?: number;
  children: React.ReactNode;
  className?: string;
};

const sideClass: Record<Side, string> = {
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
};

const sideOffset: Record<Side, { x: number; y: number }> = {
  right: { x: -4, y: 0 },
  left: { x: 4, y: 0 },
  top: { x: 0, y: 4 },
  bottom: { x: 0, y: -4 },
};

export function Tooltip({
  label,
  side = "right",
  delayMs = 500,
  children,
  className,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleEnter = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setOpen(true), delayMs);
  };
  const handleLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setOpen(false);
  };
  React.useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const offset = sideOffset[side];

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onFocus={handleEnter}
      onBlur={handleLeave}
    >
      {children}
      <AnimatePresence>
        {open && (
          <motion.span
            role="tooltip"
            initial={{ opacity: 0, x: offset.x, y: offset.y }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{
              opacity: 0,
              x: offset.x,
              y: offset.y,
              transition: { duration: 0.1 },
            }}
            transition={{ duration: 0.16, ease: [0.25, 0.46, 0.45, 0.94] }}
            className={cn(
              "absolute z-50 pointer-events-none select-none whitespace-nowrap",
              "rounded-md border border-border bg-surface px-2 py-1",
              "text-xs font-medium text-text-primary shadow-lg",
              sideClass[side],
              className,
            )}
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
