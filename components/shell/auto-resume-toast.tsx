"use client";

import { useEffect, useState } from "react";
import { cancelStaleJobs, getActiveJobs } from "@/app/actions/history";

export function AutoResumeToast() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    getActiveJobs().then((jobs) => {
      if (jobs.length > 0) setCount(jobs.length);
    });
  }, []);

  useEffect(() => {
    if (count === null) return;
    const t = setTimeout(() => {
      cancelStaleJobs().then(() => setCount(null));
    }, 30000);
    return () => clearTimeout(t);
  }, [count]);

  if (!count) return null;
  return (
    <div className="fixed bottom-4 right-4 max-w-xs rounded-md border border-border bg-surface p-4 shadow-lg">
      <p className="text-sm text-text-primary">
        Você tinha {count} download{count > 1 ? "s" : ""} em andamento.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => setCount(null)}
          className="h-8 rounded-md bg-accent border-b-2 border-accent-press px-3 text-xs font-medium text-white"
        >
          Retomar
        </button>
        <button
          onClick={() => cancelStaleJobs().then(() => setCount(null))}
          className="h-8 rounded-md border border-border px-3 text-xs text-text-muted hover:text-text-primary"
        >
          Marcar como cancelados
        </button>
      </div>
    </div>
  );
}
