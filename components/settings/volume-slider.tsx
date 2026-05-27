"use client";

import { useState, useEffect } from "react";
import { sound } from "@/lib/sound";

type Props = {
  label: string;
  description: string;
  value: number; // 0..100
  onChange: (next: number) => void;
  disabled?: boolean;
};

export function VolumeSlider({
  label,
  description,
  value,
  onChange,
  disabled,
}: Props) {
  const [internal, setInternal] = useState(value);

  useEffect(() => {
    setInternal(value);
  }, [value]);

  return (
    <div className="flex w-full items-start gap-4 py-3">
      <div className="mt-0.5 inline-flex h-5 w-9 shrink-0 items-center justify-center text-xs font-mono text-text-subtle">
        {internal.toString().padStart(2, "0")}
      </div>
      <div className="flex-1">
        <label className="block text-sm font-medium text-text-primary">
          {label}
        </label>
        <p className="mt-0.5 text-sm text-text-muted">{description}</p>
        <div className="relative mt-3 h-5 w-full">
          <div className="absolute inset-y-1/2 left-0 right-0 h-[2px] -translate-y-1/2 rounded-full bg-border">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-accent transition-[width] duration-150 ease-out-quad"
              style={{ width: `${internal}%` }}
            />
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={internal}
            disabled={disabled}
            onChange={(e) => {
              const next = Number(e.target.value);
              setInternal(next);
              onChange(next);
            }}
            onPointerUp={() => {
              // Toca um sample do volume atual quando solta
              sound.playToggleOn();
            }}
            className="absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:h-4
              [&::-webkit-slider-thumb]:w-4
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-text-primary
              [&::-webkit-slider-thumb]:border-2
              [&::-webkit-slider-thumb]:border-accent
              [&::-moz-range-thumb]:h-4
              [&::-moz-range-thumb]:w-4
              [&::-moz-range-thumb]:rounded-full
              [&::-moz-range-thumb]:bg-text-primary
              [&::-moz-range-thumb]:border-2
              [&::-moz-range-thumb]:border-accent
              focus-visible:outline-none focus-visible:[&::-webkit-slider-thumb]:shadow-focus-ring"
            aria-label={label}
          />
        </div>
      </div>
    </div>
  );
}
