/**
 * Confetti minimalist — fired apenas no completion (peak-end rule).
 * 60-80 partículas, 3 cores (accent + success + branco), spread 70°, 1.2s.
 */

type ConfettiFn = (options?: Record<string, unknown>) => void;

let cached: ConfettiFn | null = null;

async function getConfetti(): Promise<ConfettiFn | null> {
  if (cached) return cached;
  if (typeof window === "undefined") return null;
  try {
    const mod = await import("canvas-confetti");
    cached = mod.default as unknown as ConfettiFn;
    return cached;
  } catch {
    return null;
  }
}

const COLORS = [
  "hsl(263 70% 58%)", // accent
  "hsl(263 70% 70%)", // accent lighter
  "hsl(150 60% 50%)", // success
  "hsl(0 0% 95%)", // white-ish
];

export async function fireCompletionConfetti(opts: {
  enabled: boolean;
  reducedMotion: boolean;
}) {
  if (!opts.enabled || opts.reducedMotion) return;
  const confetti = await getConfetti();
  if (!confetti) return;

  confetti({
    particleCount: 70,
    spread: 70,
    startVelocity: 32,
    gravity: 1.1,
    decay: 0.9,
    ticks: 80,
    origin: { x: 0.5, y: 0.4 },
    colors: COLORS,
    scalar: 0.85,
    shapes: ["circle", "square"],
    disableForReducedMotion: true,
  });
}
