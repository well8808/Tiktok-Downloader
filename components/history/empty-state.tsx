import Link from "next/link";
import { Inbox } from "lucide-react";
import { Monogram } from "@/components/primitives/monogram";

export function HistoryEmptyState() {
  return (
    <div className="relative flex flex-col items-center justify-center text-center py-20">
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center text-text-primary opacity-[0.04]"
        aria-hidden
      >
        <Monogram size={160} decorative />
      </div>
      <Inbox size={32} className="relative text-text-subtle" />
      <h2 className="relative mt-6 text-base font-medium text-text-primary">
        Nenhum download ainda
      </h2>
      <p className="relative mt-2 text-sm text-text-muted">
        Cole um link do TikTok pra começar
      </p>
      <Link
        href="/"
        className="relative mt-6 inline-flex h-10 items-center rounded-md border border-border px-4 text-sm text-text-primary hover:bg-surface transition-colors"
      >
        Ir pra Single mode
      </Link>
    </div>
  );
}
