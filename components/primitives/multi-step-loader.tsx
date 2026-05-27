"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, Circle } from "lucide-react";
import { cn } from "@/lib/cn";

type Step = {
  label: string;
  /** index 0 = first step */
};

type Props = {
  steps: Step[];
  /** Currently-running step index. -1 means none yet started. */
  currentIndex: number;
  /** True quando o último step terminou. */
  done?: boolean;
  /** Optional error state (marca o currentIndex como falha). */
  failed?: boolean;
};

/**
 * MultiStepLoader — lista vertical de stages, com check progressivo.
 * Estilo Aceternity simplificado.
 */
export function MultiStepLoader({
  steps,
  currentIndex,
  done = false,
  failed = false,
}: Props) {
  return (
    <ul className="space-y-2.5">
      {steps.map((step, i) => {
        const isDone = done || i < currentIndex;
        const isCurrent = !done && i === currentIndex;
        const isFailed = failed && i === currentIndex;

        return (
          <li
            key={step.label}
            className="flex items-center gap-3 text-sm"
          >
            <span className="relative inline-flex h-5 w-5 items-center justify-center">
              <AnimatePresence mode="wait">
                {isFailed ? (
                  <motion.span
                    key="failed"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-danger/15 text-danger"
                  >
                    <Circle size={12} strokeWidth={3} />
                  </motion.span>
                ) : isDone ? (
                  <motion.span
                    key="done"
                    initial={{ scale: 0.4, opacity: 0, rotate: -45 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 380,
                      damping: 18,
                    }}
                    className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-success/15 text-success"
                  >
                    <Check size={12} strokeWidth={3.5} />
                  </motion.span>
                ) : isCurrent ? (
                  <motion.span
                    key="current"
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex h-5 w-5 items-center justify-center text-accent"
                  >
                    <Loader2 size={14} className="animate-spin" />
                  </motion.span>
                ) : (
                  <motion.span
                    key="pending"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.4 }}
                    className="inline-flex h-5 w-5 items-center justify-center text-text-subtle"
                  >
                    <Circle size={10} />
                  </motion.span>
                )}
              </AnimatePresence>
            </span>
            <span
              className={cn(
                "font-mono transition-colors duration-200",
                isFailed
                  ? "text-danger"
                  : isDone
                    ? "text-text-primary"
                    : isCurrent
                      ? "text-text-primary"
                      : "text-text-subtle",
              )}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
