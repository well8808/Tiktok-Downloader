"use client";

import { FolderSearch } from "lucide-react";
import { useState } from "react";
import { writeSetting } from "@/app/actions/config";

type Props = {
  initial: string;
  settingKey?: "downloadFolder" | "cleanFolder";
  promptLabel?: string;
};

export function FolderPicker({
  initial,
  settingKey = "downloadFolder",
  promptLabel = "Caminho da pasta de destino:",
}: Props) {
  const [path, setPath] = useState(initial);

  const choose = async () => {
    const next = window.prompt(promptLabel, path);
    if (next && next.trim()) {
      setPath(next.trim());
      await writeSetting(settingKey, next.trim());
    }
  };

  return (
    <div className="flex items-center gap-3">
      <input
        readOnly
        value={path}
        className="flex-1 h-10 rounded-md border border-border bg-surface px-3 font-mono text-sm text-text-primary outline-none"
      />
      <button
        onClick={choose}
        className="h-10 inline-flex items-center gap-2 rounded-md border border-border px-3 text-sm text-text-primary hover:bg-surface transition-colors"
      >
        <FolderSearch size={14} />
        Escolher
      </button>
    </div>
  );
}
