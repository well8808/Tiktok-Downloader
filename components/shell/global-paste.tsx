"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ClipboardPaste, Link as LinkIcon } from "lucide-react";
import { validateTikTokUrl } from "@/lib/downloader/url-validator";
import { sound } from "@/lib/sound";

type Toast = {
  id: number;
  message: string;
  variant: "info" | "danger";
};

let toastCounter = 0;

export function GlobalPaste() {
  const router = useRouter();
  const pathname = usePathname();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    const dispatchUrl = (raw: string) => {
      const trimmed = raw.trim();
      if (!validateTikTokUrl(trimmed)) {
        sound.playError();
        pushToast({
          id: ++toastCounter,
          message: "Esse link não é do TikTok",
          variant: "danger",
        });
        return;
      }
      sound.playPrimary();
      pushToast({
        id: ++toastCounter,
        message: "Capturado · indo pra Single mode",
        variant: "info",
      });
      window.dispatchEvent(
        new CustomEvent("ttdl:paste-url", { detail: trimmed }),
      );
      if (pathname !== "/") router.push("/");
    };

    const pushToast = (t: Toast) => {
      setToasts((prev) => [...prev, t]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== t.id));
      }, 3200);
    };

    const onPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if (isTyping) return;
      const text = e.clipboardData?.getData("text/plain") ?? "";
      if (!text) return;
      e.preventDefault();
      dispatchUrl(text);
    };

    const onDragEnter = (e: DragEvent) => {
      if (e.dataTransfer?.types.includes("text/plain")) {
        e.preventDefault();
        setDragOver(true);
      }
    };
    const onDragOver = (e: DragEvent) => {
      if (e.dataTransfer?.types.includes("text/plain")) {
        e.preventDefault();
      }
    };
    const onDragLeave = (e: DragEvent) => {
      if ((e.target as HTMLElement)?.tagName === "HTML") {
        setDragOver(false);
      }
    };
    const onDrop = (e: DragEvent) => {
      setDragOver(false);
      const target = e.target as HTMLElement | null;
      const isInTextarea =
        target &&
        (target.tagName === "TEXTAREA" || target.tagName === "INPUT");
      if (isInTextarea) return;
      const text = e.dataTransfer?.getData("text/plain") ?? "";
      if (!text) return;
      e.preventDefault();
      dispatchUrl(text);
    };

    window.addEventListener("paste", onPaste);
    window.addEventListener("dragenter", onDragEnter);
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("dragleave", onDragLeave);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("paste", onPaste);
      window.removeEventListener("dragenter", onDragEnter);
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("dragleave", onDragLeave);
      window.removeEventListener("drop", onDrop);
    };
  }, [pathname, router]);

  return (
    <>
      <AnimatePresence>
        {dragOver && (
          <motion.div
            className="fixed inset-0 z-40 pointer-events-none flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
          >
            <div className="absolute inset-2 rounded-lg border-2 border-dashed border-accent/40 bg-bg/60 backdrop-blur-[3px]" />
            <div className="relative rounded-md border border-border bg-surface px-5 py-4 shadow-lift flex items-center gap-3">
              <LinkIcon size={16} className="text-accent" />
              <span className="text-sm text-text-primary">
                Solte o link aqui pra baixar
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.96 }}
              transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="rounded-md border border-border bg-surface px-3 py-2 shadow-lift flex items-center gap-2"
            >
              <ClipboardPaste
                size={14}
                className={
                  t.variant === "danger" ? "text-danger" : "text-accent"
                }
              />
              <span className="text-xs text-text-primary">{t.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}
