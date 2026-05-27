/**
 * SoundEngine — Web Audio API synthesis family.
 *
 * Baseado em:
 * - Sound Weight Principle (LobeHub UI Sound Design)
 * - Salimpoor et al. 2011 (Nature Neuroscience) — anticipation vs peak split
 * - Schultz 2024 — Reward Prediction Error
 * - Earcons abstratos (Blattner) — família baseada em A4 = 440Hz
 *
 * Todas as durações em ms, frequências em Hz, gains absolutos 0..1.
 * O volume do usuário (0..100) multiplica o gain base.
 */

type EnvelopeShape = {
  attack: number;
  decay: number;
  sustain: number; // 0..1, multiplicador do peak
  release: number;
};

const A4 = 440;

const ENV_CLICK: EnvelopeShape = {
  attack: 0.005,
  decay: 0.04,
  sustain: 0,
  release: 0.06,
};
const ENV_PRIMARY: EnvelopeShape = {
  attack: 0.008,
  decay: 0.08,
  sustain: 0,
  release: 0.12,
};
const ENV_ANTICIPATION: EnvelopeShape = {
  attack: 0.01,
  decay: 0.1,
  sustain: 0.3,
  release: 0.15,
};
const ENV_PEAK: EnvelopeShape = {
  attack: 0.015,
  decay: 0.15,
  sustain: 0.4,
  release: 0.3,
};
const ENV_ERROR: EnvelopeShape = {
  attack: 0.02,
  decay: 0.2,
  sustain: 0,
  release: 0.2,
};

function jitter(freq: number, cents = 10): number {
  // ±10 cents random — quebra robótico sem virar variable reward
  const factor = Math.pow(2, ((Math.random() - 0.5) * 2 * cents) / 1200);
  return freq * factor;
}

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private volume = 0.6; // 0..1
  private enabled = true;
  private reducedMotion = false;

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  setVolume(value: number) {
    this.volume = Math.max(0, Math.min(1, value));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.02);
    }
  }

  setReducedMotion(value: boolean) {
    this.reducedMotion = value;
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC({ latencyHint: "interactive" });
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  private playTone(opts: {
    freq: number;
    env: EnvelopeShape;
    gainPeak: number;
    waveform?: OscillatorType;
    startOffset?: number;
    glideTo?: number;
    glideMs?: number;
  }) {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const t0 = ctx.currentTime + (opts.startOffset ?? 0);
    const peak = this.reducedMotion ? opts.gainPeak * 0.4 : opts.gainPeak;
    const env = opts.env;
    const sustainDuration = env.sustain > 0 ? 0.05 : 0;
    const totalEnd =
      t0 + env.attack + env.decay + sustainDuration + env.release;

    const osc = ctx.createOscillator();
    osc.type = opts.waveform ?? "sine";
    osc.frequency.setValueAtTime(opts.freq, t0);
    if (opts.glideTo && opts.glideMs) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(20, opts.glideTo),
        t0 + opts.glideMs / 1000,
      );
    }

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(peak, t0 + env.attack);
    const decayTarget = peak * env.sustain;
    gain.gain.linearRampToValueAtTime(
      Math.max(0.0001, decayTarget),
      t0 + env.attack + env.decay,
    );
    if (env.sustain > 0) {
      gain.gain.setValueAtTime(decayTarget, t0 + env.attack + env.decay);
      gain.gain.linearRampToValueAtTime(
        decayTarget,
        t0 + env.attack + env.decay + sustainDuration,
      );
    }
    gain.gain.exponentialRampToValueAtTime(0.0001, totalEnd);

    // Lowpass sutil pra suavizar harmônicos (anti-irritação)
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 4800;
    filter.Q.value = 0.5;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t0);
    osc.stop(totalEnd + 0.05);
  }

  /** Toggle ON: 880Hz (A5) curto. */
  playToggleOn() {
    this.playTone({ freq: jitter(A4 * 2), env: ENV_CLICK, gainPeak: 0.06 });
  }

  /** Toggle OFF: 440Hz (A4) curto. */
  playToggleOff() {
    this.playTone({ freq: jitter(A4), env: ENV_CLICK, gainPeak: 0.06 });
  }

  /** Click no botão primário: 660Hz (E5, perfect 5th). */
  playPrimary() {
    this.playTone({ freq: jitter(660), env: ENV_PRIMARY, gainPeak: 0.08 });
  }

  /** Probe success: 660+880Hz (perfect 5th harmônica) — anticipation. */
  playProbeSuccess() {
    this.playTone({
      freq: jitter(660),
      env: ENV_ANTICIPATION,
      gainPeak: 0.09,
    });
    this.playTone({
      freq: jitter(880),
      env: ENV_ANTICIPATION,
      gainPeak: 0.06,
      startOffset: 0.04,
    });
  }

  /** Download started: 660→440 glide (descending fifth) — "lá vai". */
  playStarted() {
    this.playTone({
      freq: 660,
      env: { attack: 0.015, decay: 0.25, sustain: 0, release: 0.2 },
      gainPeak: 0.08,
      glideTo: 440,
      glideMs: 250,
    });
  }

  /**
   * Completion (peak emotional): C5+E5+G5+C6 chord (major triad + octave).
   * Layered chord, ataque rápido, decay rico, sustain curto, release longo.
   */
  playComplete() {
    const chord = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
    chord.forEach((freq, i) => {
      this.playTone({
        freq: jitter(freq, 6),
        env: ENV_PEAK,
        gainPeak: 0.1 - i * 0.015,
        startOffset: i * 0.02, // micro stagger pra arpeggio
      });
    });
  }

  /** Error: 220Hz (A3) breve, não-punitivo. */
  playError() {
    this.playTone({
      freq: jitter(220),
      env: ENV_ERROR,
      gainPeak: 0.09,
      waveform: "triangle",
    });
  }

  /** Cancel: 440→330 (descending 4th). */
  playCancel() {
    this.playTone({
      freq: 440,
      env: { attack: 0.01, decay: 0.15, sustain: 0, release: 0.15 },
      gainPeak: 0.07,
      glideTo: 330,
      glideMs: 150,
    });
  }
}

const globalForSound = globalThis as unknown as { sound?: SoundEngine };
export const sound: SoundEngine =
  globalForSound.sound ?? new SoundEngine();
if (process.env.NODE_ENV !== "production") globalForSound.sound = sound;
