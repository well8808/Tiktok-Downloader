"use client";

import { useEffect, useState } from "react";
import { StatusIcon } from "@/components/primitives/status-icon";
import { ProgressBar } from "@/components/primitives/progress-bar";
import type { JobStatus } from "@/lib/downloader/types";

type JobRow = {
  id: string;
  authorHandle: string | null;
  title: string | null;
  status: JobStatus;
  errorMessage: string | null;
  fileSizeBytes: number | null;
  percent: number;
};

function fmtSize(b: number | null) {
  if (!b) return "";
  const mb = b / 1024 / 1024;
  return `${mb.toFixed(1)}MB`;
}

export function JobList({ jobIds }: { jobIds: string[] }) {
  const [jobs, setJobs] = useState<Record<string, JobRow>>({});

  useEffect(() => {
    const sources: EventSource[] = [];
    for (const id of jobIds) {
      const es = new EventSource(`/api/progress/${id}`);
      const update = (e: MessageEvent) => {
        const data = JSON.parse(e.data);
        setJobs((prev) => ({
          ...prev,
          [id]: {
            id,
            authorHandle: prev[id]?.authorHandle ?? null,
            title: prev[id]?.title ?? null,
            status: data.status,
            errorMessage: data.message ?? null,
            fileSizeBytes: prev[id]?.fileSizeBytes ?? null,
            percent: data.percent ?? 0,
          },
        }));
      };
      es.addEventListener("progress", update);
      es.addEventListener("done", update);
      sources.push(es);
    }
    return () => sources.forEach((s) => s.close());
  }, [jobIds]);

  const arr = Object.values(jobs);
  const completed = arr.filter((j) => j.status === "COMPLETED").length;
  const failed = arr.filter((j) => j.status === "FAILED").length;
  const total = jobIds.length;
  const globalPct =
    total > 0
      ? (arr.filter(
          (j) => j.status === "COMPLETED" || j.status === "FAILED",
        ).length /
          total) *
        100
      : 0;

  return (
    <div className="w-full max-w-3xl">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-text-muted">
          {completed} / {total} concluídos · {failed} falhas
        </span>
      </div>
      <ProgressBar percent={globalPct} className="mb-6" />
      <ul className="space-y-2">
        {jobIds.map((id) => {
          const j = jobs[id];
          if (!j) {
            return (
              <li key={id} className="flex items-center gap-3 py-2">
                <StatusIcon status="PENDING" />
                <span className="font-mono text-xs text-text-subtle">
                  {id.slice(0, 4)}
                </span>
                <span className="text-sm text-text-muted">na fila</span>
              </li>
            );
          }
          return (
            <li key={id} className="flex items-center gap-3 py-2">
              <StatusIcon status={j.status} />
              <span className="font-mono text-xs text-text-subtle">
                {id.slice(0, 4)}
              </span>
              <span className="font-mono text-sm text-text-primary min-w-[100px] truncate">
                {j.authorHandle ?? "..."}
              </span>
              <span className="flex-1 text-sm text-text-muted truncate">
                {j.status === "FAILED"
                  ? (j.errorMessage ?? "falhou")
                  : (j.title ?? "...")}
              </span>
              {j.status === "DOWNLOADING" && (
                <div className="w-24">
                  <ProgressBar percent={j.percent} showTicks={false} />
                </div>
              )}
              {j.status === "COMPLETED" && (
                <span className="font-mono text-xs text-text-subtle">
                  {fmtSize(j.fileSizeBytes)}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
