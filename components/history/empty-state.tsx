import Link from "next/link";
import { Inbox } from "lucide-react";

export function HistoryEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20">
      <Inbox size={32} className="text-text-subtle" />
      <h2 className="mt-6 text-base font-medium text-text-primary">
        Nenhum download ainda
      </h2>
      <p className="mt-2 text-sm text-text-muted">
        Cole um link do TikTok pra começar
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex h-10 items-center rounded-md border border-border px-4 text-sm text-text-primary hover:bg-surface transition-colors"
      >
        Ir pra Single mode
      </Link>
    </div>
  );
}
