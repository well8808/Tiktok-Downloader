import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eraser,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { JobStatus } from "@/lib/downloader/types";

const CONFIG: Record<
  JobStatus,
  { Icon: LucideIcon; color: string; spin: boolean }
> = {
  PENDING: { Icon: Clock, color: "text-text-subtle", spin: false },
  VALIDATING: { Icon: Loader2, color: "text-text-muted", spin: true },
  DOWNLOADING: { Icon: Loader2, color: "text-accent", spin: true },
  PROCESSING: { Icon: Eraser, color: "text-accent", spin: false },
  COMPLETED: { Icon: CheckCircle2, color: "text-success", spin: false },
  FAILED: { Icon: AlertCircle, color: "text-danger", spin: false },
  CANCELLED: { Icon: AlertCircle, color: "text-text-subtle", spin: false },
};

export function StatusIcon({
  status,
  size = 16,
}: {
  status: JobStatus;
  size?: number;
}) {
  const { Icon, color, spin } = CONFIG[status];
  return (
    <Icon
      size={size}
      className={cn(color, spin && "animate-spin")}
      aria-label={status}
    />
  );
}
