"use client";

import { FolderOpen, RotateCcw, Trash2 } from "lucide-react";
import { useTransition } from "react";
import { deleteJob } from "@/app/actions/history";

type Item = {
  id: string;
  authorHandle: string | null;
  title: string | null;
  thumbnailUrl: string | null;
  fileSizeBytes: number | null;
  filePath: string | null;
  finishedAt: Date | null;
};

function relativeDate(d: Date | null) {
  if (!d) return "";
  const diff = Date.now() - new Date(d).getTime();
  const h = diff / (1000 * 60 * 60);
  if (h < 1) return `${Math.max(1, Math.floor(diff / 60000))}min atrás`;
  if (h < 24) return `${Math.floor(h)}h atrás`;
  if (h < 48) return "ontem";
  return new Date(d).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
  });
}

function fmtSize(b: number | null) {
  if (!b) return "—";
  return `${(b / 1024 / 1024).toFixed(1)}MB`;
}

export function HistoryItem({
  item,
  onDelete,
}: {
  item: Item;
  onDelete: () => void;
}) {
  const [, startTransition] = useTransition();
  return (
    <li className="flex items-center gap-4 py-4 border-b border-border last:border-0">
      {item.thumbnailUrl ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={item.thumbnailUrl}
          alt=""
          className="h-9 w-16 rounded-sm object-cover border border-border"
        />
      ) : (
        <div className="h-9 w-16 rounded-sm bg-surface border border-border" />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <p className="font-mono text-sm text-text-primary truncate">
            {item.authorHandle ?? "—"}
          </p>
          <span className="font-mono text-xs text-text-subtle">
            {relativeDate(item.finishedAt)}
          </span>
        </div>
        <p className="mt-0.5 text-sm text-text-muted truncate">{item.title}</p>
        <p className="mt-0.5 font-mono text-xs text-text-subtle">
          {fmtSize(item.fileSizeBytes)} · {item.id.slice(0, 4)}
        </p>
      </div>
      <div className="flex items-center gap-1">
        {item.filePath && (
          <button
            onClick={() =>
              fetch(
                `/api/open?path=${encodeURIComponent(item.filePath as string)}`,
                { method: "POST" },
              )
            }
            title="Abrir pasta"
            className="h-8 w-8 inline-flex items-center justify-center rounded-md text-text-muted hover:text-text-primary hover:bg-surface transition-colors"
          >
            <FolderOpen size={14} />
          </button>
        )}
        <button
          title="Re-baixar (em breve)"
          className="h-8 w-8 inline-flex items-center justify-center rounded-md text-text-subtle"
          disabled
        >
          <RotateCcw size={14} />
        </button>
        <button
          onClick={() =>
            startTransition(() => {
              void deleteJob(item.id).then(onDelete);
            })
          }
          title="Remover do histórico"
          className="h-8 w-8 inline-flex items-center justify-center rounded-md text-text-muted hover:text-danger hover:bg-surface transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </li>
  );
}
