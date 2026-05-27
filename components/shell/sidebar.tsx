"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Download, Layers, History, Settings } from "lucide-react";
import { cn } from "@/lib/cn";

const ITEMS = [
  { href: "/", Icon: Download, label: "Single" },
  { href: "/batch", Icon: Layers, label: "Batch" },
  { href: "/history", Icon: History, label: "Histórico" },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-y-0 left-0 w-14 flex flex-col items-center bg-bg border-r border-border z-10">
      <div className="h-14" />
      <ul className="flex flex-col gap-1 flex-1">
        {ITEMS.map(({ href, Icon, label }) => {
          const active = pathname === href;
          return (
            <li key={href}>
              <Link
                href={href}
                title={label}
                aria-label={label}
                className={cn(
                  "group relative flex h-10 w-10 items-center justify-center rounded-md transition-colors",
                  active
                    ? "text-text-primary"
                    : "text-text-muted hover:text-text-primary",
                )}
              >
                {active && (
                  <span
                    className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 bg-text-primary"
                    aria-hidden
                  />
                )}
                <Icon size={18} />
              </Link>
            </li>
          );
        })}
      </ul>
      <Link
        href="/settings"
        title="Configurações"
        aria-label="Configurações"
        className={cn(
          "mb-3 flex h-10 w-10 items-center justify-center rounded-md transition-colors",
          pathname === "/settings"
            ? "text-text-primary"
            : "text-text-muted hover:text-text-primary",
        )}
      >
        <Settings size={18} />
      </Link>
    </nav>
  );
}
