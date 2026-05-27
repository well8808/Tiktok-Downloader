"use client";

import { useEffect, useState } from "react";
import { listHistory } from "@/app/actions/history";
import { HistoryEmptyState } from "@/components/history/empty-state";
import { HistoryItem } from "@/components/history/history-item";
import { HistorySkeleton } from "@/components/history/skeleton";

type Job = Awaited<ReturnType<typeof listHistory>>[number];

export default function HistoryPage() {
  const [items, setItems] = useState<Job[] | null>(null);

  const refresh = () => listHistory().then(setItems);
  useEffect(() => {
    refresh();
  }, []);

  if (items === null) return <HistorySkeleton />;
  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <HistoryEmptyState />
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-3xl p-6 pt-12">
      <h1 className="text-xl font-medium text-text-primary mb-6">Histórico</h1>
      <ul>
        {items.map((item) => (
          <HistoryItem key={item.id} item={item} onDelete={refresh} />
        ))}
      </ul>
    </div>
  );
}
