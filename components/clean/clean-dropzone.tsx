"use client";

import { useCallback, useRef, useState } from "react";
import {
  Eraser,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  FolderOpen,
  Plus,
  type LucideIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cleanVideo } from "@/app/actions/clean";
import { sound } from "@/lib/sound";
import { cn } from "@/lib/cn";

const EASE = [0.25, 0.46, 0.45, 0.94] as const;
const VIDEO_EXTS = [".mp4", ".mov", ".m4v", ".webm", ".mkv", ".avi"];

function baseName(p: string): string {
  return p.split(/[\\/]/).pop() || p;
}

function isVideo(p: string): boolean {
  const lower = p.toLowerCase();
  return VIDEO_EXTS.some((ext) => lower.endsWith(ext));
}

type Status = "queued" | "cleaning" | "done" | "error";

type Item = {
  id: number;
  name: string;
  path: string;
  status: Status;
  detail?: string;
  outPath?: string;
};

const GLYPH: Record<Status, { Icon: LucideIcon; color: string; spin: boolean }> = {
  queued: { Icon: Clock, color: "text-text-subtle", spin: false },
  cleaning: { Icon: Loader2, color: "text-accent", spin: true },
  done: { Icon: CheckCircle2, color: "text-success", spin: false },
  error: { Icon: AlertCircle, color: "text-danger", spin: false },
};

const STATUS_LABEL: Record<Status, string> = {
  queued: "na fila",
  cleaning: "limpando…",
  done: "pronto",
  error: "erro",
};

export function CleanDropzone() {
  const [items, setItems] = useState<Item[]>([]);
  const [dragging, setDragging] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const idRef = useRef(0);
  const queueRef = useRef<Item[]>([]);
  const processingRef = useRef(false);
  const lastOutPathRef = useRef<string | null>(null);

  const patch = useCallback((id: number, next: Partial<Item>) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, ...next } : it)),
    );
  }, []);

  // Processa a fila um arquivo por vez — ffmpeg um de cada vez, e um erro
  // num arquivo não derruba os outros.
  const drain = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    try {
      while (queueRef.current.length > 0) {
        const item = queueRef.current.shift();
        if (!item) break;
        patch(item.id, { status: "cleaning" });
        const res = await cleanVideo(item.path);
        if (res.ok) {
          lastOutPathRef.current = res.outPath;
          patch(item.id, { status: "done", detail: res.fileName });
          sound.playComplete();
        } else {
          patch(item.id, { status: "error", detail: res.message });
          sound.playError();
        }
      }
    } finally {
      processingRef.current = false;
    }
  }, [patch]);

  const addPaths = useCallback(
    (paths: string[]) => {
      const valid = paths.filter(isVideo);
      const rejected = paths.length - valid.length;
      if (valid.length === 0) {
        if (paths.length > 0) {
          setNotice("Nenhum arquivo de vídeo suportado nessa seleção.");
        }
        return;
      }
      setNotice(
        rejected > 0
          ? `${rejected} arquivo(s) ignorado(s) — formato não suportado.`
          : null,
      );
      const newItems: Item[] = valid.map((p) => ({
        id: (idRef.current += 1),
        name: baseName(p),
        path: p,
        status: "queued" as const,
      }));
      setItems((prev) => [...prev, ...newItems]);
      queueRef.current.push(...newItems);
      void drain();
    },
    [drain],
  );

  const pick = useCallback(async () => {
    sound.playPrimary();
    setNotice(null);
    if (window.desktop?.selectVideos) {
      const paths = await window.desktop.selectVideos();
      addPaths(paths);
    } else {
      // Fora do Electron (dev no browser): sem seletor nativo, cai pro caminho manual.
      const p = window.prompt("Caminho do vídeo pra limpar:");
      if (p && p.trim()) addPaths([p.trim()]);
    }
  }, [addPaths]);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length === 0) return;
      const getPath = window.desktop?.getPathForFile;
      if (!getPath) {
        setNotice("Arrastar só funciona no app instalado. Use o botão pra escolher.");
        return;
      }
      addPaths(files.map((f) => getPath(f)).filter(Boolean));
    },
    [addPaths],
  );

  const openFolder = useCallback(() => {
    const out = lastOutPathRef.current;
    if (!out) return;
    void fetch(`/api/open?path=${encodeURIComponent(out)}`, { method: "POST" });
  }, []);

  const doneCount = items.filter((it) => it.status === "done").length;

  return (
    <div className="mx-auto max-w-2xl p-6 pt-12">
      <header>
        <h1 className="text-xl font-medium text-text-primary">
          Limpar metadados
        </h1>
        <p className="mt-1.5 max-w-prose text-sm text-text-muted">
          Remove o que identifica vídeos de IA — encoder, datas, e as
          credenciais C2PA / Content Credentials que Higgsfield, Kling e afins
          embutem. Remux sem reencodar: rápido e sem perda. Os originais ficam
          intactos.
        </p>
      </header>

      <div
        role="button"
        tabIndex={0}
        onClick={pick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            void pick();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "mt-8 flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed px-6 py-14 text-center outline-none transition-all duration-200 ease-out-quad",
          "focus-visible:border-accent focus-visible:shadow-focus-ring",
          dragging
            ? "border-accent bg-surface-hover shadow-focus-ring-strong"
            : "border-border bg-surface hover:border-text-subtle hover:bg-surface-hover",
        )}
      >
        <motion.span
          animate={{ scale: dragging ? 1.08 : 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full transition-colors",
            dragging ? "bg-accent/15 text-accent" : "bg-surface-hover text-text-muted",
          )}
        >
          <Eraser size={20} />
        </motion.span>
        <p className="mt-4 text-sm text-text-primary">
          {dragging ? "Solte pra limpar" : "Arraste vídeos aqui"}
        </p>
        <p className="mt-1 font-mono text-xs text-text-subtle">
          mp4 · mov · m4v · webm · mkv · avi
        </p>
        <span className="pointer-events-none mt-5 inline-flex h-10 items-center gap-2 rounded-md bg-accent px-4 text-sm font-medium text-white">
          <Plus size={14} />
          Selecionar vídeos
        </span>
      </div>

      <p className="mt-3 text-center text-xs text-text-subtle">
        Remove só metadados — marca d&apos;água em pixels (ex.: SynthID) e logos
        visíveis não saem.
      </p>

      <AnimatePresence>
        {notice && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: EASE }}
            className="mt-4 text-center text-xs text-warning"
          >
            {notice}
          </motion.p>
        )}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {items.length > 0 && (
          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 divide-y divide-border overflow-hidden rounded-md border border-border"
          >
            {items.map((it) => {
              const { Icon, color, spin } = GLYPH[it.status];
              return (
                <motion.li
                  key={it.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, ease: EASE }}
                  className="flex items-center gap-3 bg-surface px-3.5 py-3"
                >
                  <Icon
                    size={16}
                    className={cn(color, spin && "animate-spin")}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-text-primary">
                      {it.name}
                    </p>
                    {it.status === "error" && it.detail && (
                      <p className="truncate text-xs text-danger">{it.detail}</p>
                    )}
                    {it.status === "done" && it.detail && it.detail !== it.name && (
                      <p className="truncate text-xs text-text-subtle">
                        salvo como {it.detail}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-text-muted">
                    {STATUS_LABEL[it.status]}
                  </span>
                </motion.li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>

      {doneCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: EASE }}
          className="mt-6 flex items-center justify-between border-t border-border pt-5"
        >
          <p className="text-sm text-text-muted">
            {doneCount} {doneCount === 1 ? "vídeo limpo" : "vídeos limpos"}
          </p>
          <button
            type="button"
            onClick={openFolder}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm text-text-primary transition-colors hover:bg-surface-hover"
          >
            <FolderOpen size={14} />
            Abrir pasta
          </button>
        </motion.div>
      )}
    </div>
  );
}
