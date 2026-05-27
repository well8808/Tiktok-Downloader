"use client";

import { useState } from "react";
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
      className="flex w-full items-start gap-4 py-3 text-left"
    >
      <span
        className={cn(
          "mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
          checked ? "bg-accent" : "bg-border",
        )}
      >
        <span
          className={cn(
            "h-4 w-4 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-[18px]" : "translate-x-0.5",
          )}
        />
      </span>
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
