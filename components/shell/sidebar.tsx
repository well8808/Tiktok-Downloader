"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Download, Layers, History, Settings, Command } from "lucide-react";
import { motion, LayoutGroup } from "framer-motion";
import { Monogram } from "@/components/primitives/monogram";
import { Tooltip } from "@/components/primitives/tooltip";
import { cn } from "@/lib/cn";

function dispatchHelpToggle() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new KeyboardEvent("keydown", { key: "?", bubbles: true }),
  );
}

const ITEMS = [
  { href: "/", Icon: Download, label: "Single" },
  { href: "/batch", Icon: Layers, label: "Batch" },
  { href: "/history", Icon: History, label: "Histórico" },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-y-0 left-0 w-14 flex flex-col items-center bg-bg border-r border-border z-10">
      <div className="h-14 flex items-center justify-center text-text-primary">
        <Monogram size={18} />
      </div>
      <LayoutGroup id="sidebar-active">
        <ul className="flex flex-col gap-1 flex-1">
          {ITEMS.map(({ href, Icon, label }) => {
            const active = pathname === href;
            return (
              <li key={href}>
                <Tooltip label={label} side="right">
                  <Link
                    href={href}
                    aria-label={label}
                    className={cn(
                      "group relative flex h-10 w-10 items-center justify-center rounded-md transition-colors",
                      active
                        ? "text-text-primary"
                        : "text-text-muted hover:text-text-primary",
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="sidebar-active-bar"
                        className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 bg-text-primary"
                        transition={{
                          type: "spring",
                          stiffness: 600,
                          damping: 40,
                        }}
                        aria-hidden
                      />
                    )}
                    <Icon size={18} />
                  </Link>
                </Tooltip>
              </li>
            );
          })}
        </ul>
        <Tooltip label="Atalhos (?)" side="right">
          <button
            type="button"
            onClick={dispatchHelpToggle}
            aria-label="Mostrar atalhos"
            className="flex h-10 w-10 items-center justify-center rounded-md text-text-subtle hover:text-text-primary transition-colors"
          >
            <Command size={16} />
          </button>
        </Tooltip>
        <Tooltip label="Configurações" side="right">
          <Link
            href="/settings"
            aria-label="Configurações"
            className={cn(
              "relative mb-3 flex h-10 w-10 items-center justify-center rounded-md transition-colors",
              pathname === "/settings"
                ? "text-text-primary"
                : "text-text-muted hover:text-text-primary",
            )}
          >
            {pathname === "/settings" && (
              <motion.span
                layoutId="sidebar-active-bar"
                className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 bg-text-primary"
                transition={{ type: "spring", stiffness: 600, damping: 40 }}
                aria-hidden
              />
            )}
            <Settings size={18} />
          </Link>
        </Tooltip>
      </LayoutGroup>
    </nav>
  );
}
