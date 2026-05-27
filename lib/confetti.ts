/**
 * Confetti v3 — tsParticles fireworks + confetti coordenados.
 *
 * Diferença pro v2: usa @tsparticles/confetti (NÃO o canvas-confetti)
 * com emitters reais, gravity tunada, e arcos longos.
 * Disparo coordenado: confetti central + 2 emitters laterais com angle.
 */

type ConfettiOptions = Record<string, unknown>;
type ConfettiFn = (
  options?: ConfettiOptions,
) => Promise<unknown> | undefined;

let cached: ConfettiFn | null = null;

async function getConfetti(): Promise<ConfettiFn | null> {
  if (cached) return cached;
  if (typeof window === "undefined") return null;
  try {
    const mod = await import("@tsparticles/confetti");
    cached = mod.confetti as unknown as ConfettiFn;
    return cached;
  } catch {
    return null;
  }
}

const PALETTE = [
  "#a78bfa", // accent light
  "#8b5cf6", // accent
  "#7c3aed", // accent deep
  "#34d399", // success light
  "#10b981", // success
  "#f3f0ff", // white-ish
];

const PALETTE_FIREWORK = [
  "#a78bfa",
  "#8b5cf6",
  "#34d399",
  "#fde68a", // soft warm yellow pra sparkle
  "#f3f0ff",
];

/**
 * Completion celebration: 3 bursts coordenados.
 *
 * t=0:    central burst (heavy)
 * t=150:  left + right side bursts
 * t=350:  vertical sparkle (delayed)
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
  const y = opts.originY ?? 0.5;

  // Central burst - heavy
  void confetti({
    particleCount: 120,
    spread: 100,
    startVelocity: 48,
    decay: 0.92,
    gravity: 0.95,
    ticks: 220,
    origin: { x, y },
    colors: PALETTE,
    scalar: 1.1,
    shapes: ["square", "circle"],
    disableForReducedMotion: true,
  });

  // Side bursts com leve delay pra escalonar a vista
  window.setTimeout(() => {
    void confetti({
      particleCount: 60,
      angle: 60,
      spread: 50,
      startVelocity: 55,
      decay: 0.9,
      gravity: 1.0,
      origin: { x: Math.max(0, x - 0.22), y: y + 0.05 },
      colors: PALETTE_FIREWORK,
      scalar: 0.95,
      shapes: ["circle"],
      disableForReducedMotion: true,
    });
    void confetti({
      particleCount: 60,
      angle: 120,
      spread: 50,
      startVelocity: 55,
      decay: 0.9,
      gravity: 1.0,
      origin: { x: Math.min(1, x + 0.22), y: y + 0.05 },
      colors: PALETTE_FIREWORK,
      scalar: 0.95,
      shapes: ["circle"],
      disableForReducedMotion: true,
    });
  }, 150);

  // Sparkle tardia descendo do topo
  window.setTimeout(() => {
    void confetti({
      particleCount: 40,
      spread: 140,
      startVelocity: 18,
      decay: 0.94,
      gravity: 0.65,
      origin: { x, y: Math.max(0, y - 0.12) },
      colors: ["#f3f0ff", "#a78bfa", "#fde68a"],
      scalar: 0.65,
      shapes: ["circle"],
      disableForReducedMotion: true,
    });
  }, 350);
}

/**
 * Mini sparkle — probe success. ~30 partículas suaves saindo do input.
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
    particleCount: 32,
    spread: 65,
    startVelocity: 28,
    gravity: 1.0,
    decay: 0.92,
    ticks: 80,
    origin: { x: opts.originX ?? 0.5, y: opts.originY ?? 0.48 },
    colors: ["#a78bfa", "#8b5cf6", "#f3f0ff"],
    scalar: 0.7,
    shapes: ["circle"],
    disableForReducedMotion: true,
  });
}
