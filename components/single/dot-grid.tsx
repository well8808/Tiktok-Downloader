/**
 * DotGrid — background ambient pattern.
 * SVG dot grid com mask radial fade pro centro.
 * Estático, sem JS animation. Linear/Vercel signature.
 */

type Props = {
  /** Spacing em px entre os dots. Default 28. */
  spacing?: number;
  /** Tamanho do raio do dot. Default 1. */
  size?: number;
  /** Cor dos dots em HSL legacy (sem hsl(...)). Default cinza sutil. */
  color?: string;
  /** Fade mask: 'center' radial, 'top' top-down, 'none'. Default 'center'. */
  fade?: "center" | "top" | "none";
  className?: string;
};

export function DotGrid({
  spacing = 28,
  size = 1,
  color = "240 5% 30%",
  fade = "center",
  className,
}: Props) {
  const maskImage =
    fade === "center"
      ? "radial-gradient(ellipse 70% 60% at 50% 50%, black 0%, black 40%, transparent 85%)"
      : fade === "top"
        ? "linear-gradient(to bottom, black 0%, transparent 80%)"
        : undefined;

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className ?? ""}`}
      style={{
        maskImage,
        WebkitMaskImage: maskImage,
      }}
    >
      <svg
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0"
      >
        <defs>
          <pattern
            id={`dot-grid-${spacing}-${size}`}
            x="0"
            y="0"
            width={spacing}
            height={spacing}
            patternUnits="userSpaceOnUse"
          >
            <circle
              cx={spacing / 2}
              cy={spacing / 2}
              r={size}
              fill={`hsl(${color})`}
              opacity="0.55"
            />
          </pattern>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill={`url(#dot-grid-${spacing}-${size})`}
        />
      </svg>
    </div>
  );
}
