import { cn } from "@/lib/cn";

type Props = {
  size?: number;
  className?: string;
  decorative?: boolean;
};

export function Monogram({ size = 18, className, decorative = false }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden={decorative}
      role={decorative ? "presentation" : "img"}
      aria-label={decorative ? undefined : "TikTok Downloader"}
      className={cn("shrink-0", className)}
    >
      <rect
        x="1.5"
        y="1.5"
        width="21"
        height="21"
        rx="5.5"
        stroke="currentColor"
        strokeOpacity="0.9"
        strokeWidth="1.25"
      />
      <path
        d="M8.25 7.5h7.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M12 7.75v6.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M9 14l3 3 3-3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
