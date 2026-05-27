import { cn } from "@/lib/cn";

export function Kbd({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <kbd
      className={cn(
        "inline-flex items-center justify-center",
        "h-5 min-w-[20px] px-1.5",
        "rounded-sm bg-surface border border-border",
        "font-mono text-xs text-text-subtle",
        "label-track",
        className,
      )}
    >
      {children}
    </kbd>
  );
}
