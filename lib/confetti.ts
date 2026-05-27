/**
 * Confetti — versão explosiva pra completion + mini pra probe success.
 */

type ConfettiFn = (options?: Record<string, unknown>) => Promise<void> | void;

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

const PALETTE = {
  accent: "hsl(263 70% 58%)",
  accentLight: "hsl(263 70% 72%)",
  accentDeep: "hsl(263 70% 44%)",
  success: "hsl(150 60% 50%)",
  successLight: "hsl(150 60% 65%)",
  white: "hsl(0 0% 95%)",
};

/**
 * Completion celebration: 3 bursts coordenados a partir do card.
 * Total ~220 particles entre os bursts. Spread amplo. Dura ~1.6s.
 */
export async function fireCompletionConfetti(opts: {
  enabled: boolean;
  reducedMotion: boolean;
  originX?: number;
  originY?: number;
}) {
  if (!opts.enabled || opts.reducedMotion) return;
  const confetti = await getConfetti();
  if (!confetti) return;

  const x = opts.originX ?? 0.5;
  const y = opts.originY ?? 0.42;

  // Burst central
  void confetti({
    particleCount: 110,
    spread: 90,
    startVelocity: 42,
    gravity: 1.0,
    decay: 0.91,
    ticks: 110,
    origin: { x, y },
    colors: [
      PALETTE.accent,
      PALETTE.accentLight,
      PALETTE.success,
      PALETTE.successLight,
      PALETTE.white,
    ],
    scalar: 0.95,
    shapes: ["circle", "square"],
    disableForReducedMotion: true,
  });

  // Side bursts (esquerda e direita) com leve delay pra escalonar
  window.setTimeout(() => {
    void confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      startVelocity: 50,
      origin: { x: Math.max(0, x - 0.18), y: y + 0.05 },
      colors: [PALETTE.accent, PALETTE.accentDeep, PALETTE.white],
      scalar: 0.85,
      shapes: ["circle"],
      disableForReducedMotion: true,
    });
    void confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      startVelocity: 50,
      origin: { x: Math.min(1, x + 0.18), y: y + 0.05 },
      colors: [PALETTE.success, PALETTE.accentLight, PALETTE.white],
      scalar: 0.85,
      shapes: ["circle"],
      disableForReducedMotion: true,
    });
  }, 140);

  // Sparkle tardia, fina
  window.setTimeout(() => {
    void confetti({
      particleCount: 30,
      spread: 130,
      startVelocity: 22,
      gravity: 0.7,
      decay: 0.94,
      origin: { x, y: y - 0.08 },
      colors: [PALETTE.white, PALETTE.accentLight],
      scalar: 0.6,
      shapes: ["circle"],
      disableForReducedMotion: true,
    });
  }, 320);
}

/**
 * Mini confetti pra probe success — discreto, "sparkle" sutil saindo
 * do input. ~25 particles, fast, 0.6s.
 */
export async function fireProbeSparkle(opts: {
  enabled: boolean;
  reducedMotion: boolean;
  originX?: number;
  originY?: number;
}) {
  if (!opts.enabled || opts.reducedMotion) return;
  const confetti = await getConfetti();
  if (!confetti) return;

  void confetti({
    particleCount: 28,
    spread: 60,
    startVelocity: 26,
    gravity: 0.95,
    decay: 0.92,
    ticks: 60,
    origin: { x: opts.originX ?? 0.5, y: opts.originY ?? 0.48 },
    colors: [PALETTE.accent, PALETTE.accentLight, PALETTE.white],
    scalar: 0.7,
    shapes: ["circle"],
    disableForReducedMotion: true,
  });
}
