"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Kbd } from "@/components/primitives/kbd";

const ROUTES = [
  { combo: "1", path: "/", label: "Single" },
  { combo: "2", path: "/batch", label: "Batch" },
  { combo: "3", path: "/history", label: "Histórico" },
  { combo: "4", path: "/settings", label: "Configurações" },
] as const;

export function KeyboardNav() {
  const router = useRouter();
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      if (e.key === "?" && !isTyping) {
        e.preventDefault();
        setHelpOpen((v) => !v);
        return;
      }
      if (e.key === "Escape" && helpOpen) {
        e.preventDefault();
        setHelpOpen(false);
        return;
      }

      const modifier = e.metaKey || e.ctrlKey;
      if (!modifier) return;

      const match = ROUTES.find((r) => r.combo === e.key);
      if (match) {
        e.preventDefault();
        router.push(match.path);
        return;
      }
      if (e.key.toLowerCase() === "k" && !isTyping) {
        e.preventDefault();
        const input = document.querySelector<HTMLInputElement>(
          'input[placeholder="https://..."]',
        );
        if (input) {
          router.push("/");
          setTimeout(() => input.focus(), 220);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [router, helpOpen]);

  return (
    <AnimatePresence>
      {helpOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-bg/70 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.14 }}
          onClick={() => setHelpOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-md border border-border bg-surface p-5 shadow-lift"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-text-primary">
                Atalhos
              </h2>
              <button
                onClick={() => setHelpOpen(false)}
                className="text-xs text-text-muted hover:text-text-primary font-mono"
              >
                esc
              </button>
            </div>
            <ul className="mt-4 space-y-2">
              {ROUTES.map(({ combo, label }) => (
                <li
                  key={combo}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-text-muted">{label}</span>
                  <span className="flex items-center gap-1">
                    <Kbd>⌘</Kbd>
                    <Kbd>{combo}</Kbd>
                  </span>
                </li>
              ))}
              <li className="flex items-center justify-between text-sm pt-2 border-t border-border">
                <span className="text-text-muted">Foco no input</span>
                <span className="flex items-center gap-1">
                  <Kbd>⌘</Kbd>
                  <Kbd>K</Kbd>
                </span>
              </li>
              <li className="flex items-center justify-between text-sm">
                <span className="text-text-muted">Abrir/fechar atalhos</span>
                <span className="flex items-center gap-1">
                  <Kbd>?</Kbd>
                </span>
              </li>
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
