export function HistorySkeleton() {
  return (
    <div className="mx-auto max-w-3xl p-6 pt-12">
      <div className="h-6 w-24 rounded-md skeleton" aria-hidden />
      <ul className="mt-6">
        {[0, 1, 2].map((i) => (
          <li
            key={i}
            className="flex items-center gap-4 py-4 border-b border-border last:border-0"
            aria-hidden
          >
            <div className="h-9 w-16 rounded-sm skeleton" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-3 w-32 rounded-sm skeleton" />
              <div className="h-3 w-2/3 rounded-sm skeleton" />
              <div className="h-2.5 w-20 rounded-sm skeleton" />
            </div>
          </li>
        ))}
      </ul>
      <span className="sr-only">Carregando histórico</span>
    </div>
  );
}
