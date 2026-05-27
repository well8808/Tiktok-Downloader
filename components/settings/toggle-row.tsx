"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

type Props = {
  label: string;
  description: string;
  defaultChecked: boolean;
  onChange: (next: boolean) => Promise<unknown> | void;
};

export function ToggleRow({
  label,
  description,
  defaultChecked,
  onChange,
}: Props) {
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => {
        const next = !checked;
        setChecked(next);
        void onChange(next);
      }}
      className="group flex w-full items-start gap-4 py-3 text-left focus-visible:outline-none"
    >
      <motion.span
        animate={{
          backgroundColor: checked
            ? "hsl(263 70% 58%)"
            : "hsl(240 5% 14%)",
        }}
        transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={cn(
          "relative mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full",
          "group-focus-visible:shadow-focus-ring",
        )}
      >
        <motion.span
          layout
          animate={{ x: checked ? 18 : 2 }}
          transition={{ type: "spring", stiffness: 700, damping: 30 }}
          className="absolute h-4 w-4 rounded-full bg-white shadow"
        />
      </motion.span>
      <span className="flex-1">
        <span className="block text-sm font-medium text-text-primary">
          {label}
        </span>
        <span className="mt-0.5 block text-sm text-text-muted">
          {description}
        </span>
      </span>
    </button>
  );
}
