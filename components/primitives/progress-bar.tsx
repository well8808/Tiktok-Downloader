import { cn } from "@/lib/cn";

type Variant = "default" | "success" | "danger";

const VARIANTS: Record<Variant, string> = {
  default: "bg-accent",
  success: "bg-success",
  danger: "bg-danger",
};

export function ProgressBar({
  percent,
  variant = "default",
  showTicks = true,
  shimmer = false,
  className,
}: {
  percent: number;
  variant?: Variant;
  showTicks?: boolean;
  shimmer?: boolean;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div
      className={cn(
        "relative h-[2px] w-full bg-border overflow-hidden rounded-full",
        className,
      )}
    >
      <div
        className={cn(
          "absolute inset-y-0 left-0 transition-[width] duration-200 ease-out-quad",
          VARIANTS[variant],
        )}
        style={{ width: `${clamped}%` }}
      >
        {shimmer && (
          <span
            aria-hidden
            className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer"
          />
        )}
      </div>
      {showTicks && (
        <div className="absolute inset-0 flex justify-between pointer-events-none">
          {[25, 50, 75].map((t) => (
            <span
              key={t}
              className="block w-px bg-bg"
              style={{ marginLeft: `${t}%` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
