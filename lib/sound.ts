/**
 * SoundEngine v2 — Multi-oscillator + reverb sintético + compressor.
 *
 * Diferença pro v1: em vez de senoides puras (= beep), cada nota é
 * camada de 2-3 osciladores com detune (chorus), passando por filter
 * resonante, reverb (ConvolverNode com IR sintetizado), e compressor
 * (punch).
 *
 * Resultado: sons com TIMBRE — bell-ish nos antecipatórios, rich chord
 * no completion, snap nos clicks.
 */

type Layer = {
  type: OscillatorType;
  detuneCents?: number; // offset de pitch
  gain: number; // mix gain relativo
};

type Envelope = {
  attack: number; // s
  decay: number; // s
  sustain: number; // 0..1
  release: number; // s
};

const A4 = 440;

// Layered patches — cada som é resultado de múltiplas oscillators
const PATCH_CLICK: Layer[] = [
  { type: "triangle", gain: 0.6 },
  { type: "sine", detuneCents: -7, gain: 0.4 },
];
const PATCH_PRIMARY: Layer[] = [
  { type: "triangle", gain: 0.55 },
  { type: "sine", detuneCents: 0, gain: 0.5 },
  { type: "sine", detuneCents: 1200, gain: 0.18 }, // 1 oitava acima
];
const PATCH_BELL: Layer[] = [
  { type: "sine", gain: 0.5 },
  { type: "sine", detuneCents: 1200, gain: 0.25 },
  { type: "sine", detuneCents: 1902, gain: 0.12 }, // 12th
  { type: "triangle", detuneCents: -3, gain: 0.2 },
];
const PATCH_CHORD: Layer[] = [
  { type: "triangle", gain: 0.45 },
  { type: "sine", detuneCents: -6, gain: 0.55 },
  { type: "sine", detuneCents: +6, gain: 0.45 },
  { type: "sine", detuneCents: 1200, gain: 0.22 },
];
const PATCH_LOW: Layer[] = [
  { type: "triangle", gain: 0.7 },
  { type: "sawtooth", detuneCents: 7, gain: 0.18 },
  { type: "sine", detuneCents: -1200, gain: 0.4 },
];

const ENV_CLICK: Envelope = {
  attack: 0.003,
  decay: 0.07,
  sustain: 0,
  release: 0.12,
};
const ENV_PRIMARY: Envelope = {
  attack: 0.005,
  decay: 0.12,
  sustain: 0,
  release: 0.18,
};
const ENV_BELL: Envelope = {
  attack: 0.004,
  decay: 0.6,
  sustain: 0.15,
  release: 0.5,
};
const ENV_PEAK: Envelope = {
  attack: 0.008,
  decay: 0.35,
  sustain: 0.5,
  release: 1.4,
};
const ENV_LOW: Envelope = {
  attack: 0.012,
  decay: 0.2,
  sustain: 0,
  release: 0.3,
};

function jitter(freq: number, cents = 8): number {
  const factor = Math.pow(2, ((Math.random() - 0.5) * 2 * cents) / 1200);
  return freq * factor;
}

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private reverb: ConvolverNode | null = null;
  private reverbGain: GainNode | null = null;
  private dry: GainNode | null = null;
  private volume = 0.6;
  private enabled = true;
  private reducedMotion = false;

  setEnabled(v: boolean) {
    this.enabled = v;
  }

  setVolume(v: number) {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(
        this.volume,
        this.ctx.currentTime,
        0.02,
      );
    }
  }

  setReducedMotion(v: boolean) {
    this.reducedMotion = v;
  }

  private buildImpulseResponse(ctx: AudioContext): AudioBuffer {
    // Plate-ish reverb sintético — IR de 1.8s com decay exponencial
    const length = ctx.sampleRate * 1.8;
    const ir = ctx.createBuffer(2, length, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = ir.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        const t = i / length;
        // Noise multiplicado por decay exponencial
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 2.8);
      }
    }
    return ir;
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

      // Signal chain: oscillators -> [dry] + [reverb] -> compressor -> masterGain -> destination
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.value = -18;
      this.compressor.knee.value = 12;
      this.compressor.ratio.value = 4;
      this.compressor.attack.value = 0.003;
      this.compressor.release.value = 0.18;

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume;

      this.dry = this.ctx.createGain();
      this.dry.gain.value = 0.85;

      this.reverb = this.ctx.createConvolver();
      this.reverb.buffer = this.buildImpulseResponse(this.ctx);
      this.reverbGain = this.ctx.createGain();
      this.reverbGain.gain.value = 0.22;

      this.dry.connect(this.compressor);
      this.reverb.connect(this.reverbGain);
      this.reverbGain.connect(this.compressor);
      this.compressor.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  private playNote(opts: {
    freq: number;
    patch: Layer[];
    env: Envelope;
    gainPeak: number;
    startOffset?: number;
    filterFreq?: number;
    filterQ?: number;
    glideTo?: number;
    glideMs?: number;
    reverbSend?: number;
  }) {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.dry || !this.reverb) return;

    const t0 = ctx.currentTime + (opts.startOffset ?? 0);
    const env = opts.env;
    const peak = this.reducedMotion ? opts.gainPeak * 0.5 : opts.gainPeak;
    const sustainTime = env.sustain > 0 ? 0.08 : 0;
    const totalEnd =
      t0 + env.attack + env.decay + sustainTime + env.release;

    // Filter + ADSR gain shared para todos os layers
    const noteGain = ctx.createGain();
    noteGain.gain.setValueAtTime(0, t0);
    noteGain.gain.linearRampToValueAtTime(peak, t0 + env.attack);
    const decayTarget = Math.max(0.0001, peak * env.sustain);
    noteGain.gain.exponentialRampToValueAtTime(
      decayTarget,
      t0 + env.attack + env.decay,
    );
    if (env.sustain > 0) {
      noteGain.gain.linearRampToValueAtTime(
        decayTarget,
        t0 + env.attack + env.decay + sustainTime,
      );
    }
    noteGain.gain.exponentialRampToValueAtTime(0.0001, totalEnd);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = opts.filterFreq ?? 5200;
    filter.Q.value = opts.filterQ ?? 0.8;

    noteGain.connect(filter);

    // Dry path + reverb send
    const reverbSendGain = ctx.createGain();
    reverbSendGain.gain.value = opts.reverbSend ?? 0.5;
    filter.connect(this.dry);
    filter.connect(reverbSendGain);
    reverbSendGain.connect(this.reverb);

    // Cria osciladores layered, com detune e gain relativo
    opts.patch.forEach((layer) => {
      const osc = ctx.createOscillator();
      osc.type = layer.type;
      osc.frequency.setValueAtTime(opts.freq, t0);
      osc.detune.setValueAtTime(layer.detuneCents ?? 0, t0);
      if (opts.glideTo && opts.glideMs) {
        osc.frequency.exponentialRampToValueAtTime(
          Math.max(20, opts.glideTo),
          t0 + opts.glideMs / 1000,
        );
      }
      const layerGain = ctx.createGain();
      layerGain.gain.value = layer.gain;
      osc.connect(layerGain);
      layerGain.connect(noteGain);
      osc.start(t0);
      osc.stop(totalEnd + 0.1);
    });
  }

  /** Toggle ON: bright triangle dyad. */
  playToggleOn() {
    this.playNote({
      freq: jitter(A4 * 2),
      patch: PATCH_CLICK,
      env: ENV_CLICK,
      gainPeak: 0.16,
      filterFreq: 6000,
      reverbSend: 0.18,
    });
  }

  /** Toggle OFF: deeper. */
  playToggleOff() {
    this.playNote({
      freq: jitter(A4),
      patch: PATCH_CLICK,
      env: ENV_CLICK,
      gainPeak: 0.14,
      filterFreq: 4000,
      reverbSend: 0.18,
    });
  }

  /** Primary click: snappy with weight. */
  playPrimary() {
    this.playNote({
      freq: jitter(660),
      patch: PATCH_PRIMARY,
      env: ENV_PRIMARY,
      gainPeak: 0.2,
      filterFreq: 5800,
      reverbSend: 0.32,
    });
  }

  /** Probe success: bright bell chord — caudate anticipation. */
  playProbeSuccess() {
    // C major triad bell-like (C5 E5 G5 + octave shimmer)
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((n, i) => {
      this.playNote({
        freq: jitter(n, 5),
        patch: PATCH_BELL,
        env: ENV_BELL,
        gainPeak: 0.16 - i * 0.02,
        filterFreq: 7000,
        filterQ: 1.2,
        startOffset: i * 0.025,
        reverbSend: 0.55,
      });
    });
  }

  /** Download started: pitched-down whoosh. */
  playStarted() {
    this.playNote({
      freq: 880,
      patch: PATCH_LOW,
      env: { attack: 0.01, decay: 0.3, sustain: 0, release: 0.25 },
      gainPeak: 0.18,
      glideTo: 330,
      glideMs: 300,
      filterFreq: 3200,
      reverbSend: 0.4,
    });
  }

  /**
   * COMPLETION (peak): full major triad + octave shimmer, arpeggiated,
   * with longer reverb tail.
   */
  playComplete() {
    // F major chord (F4 A4 C5 F5) + octave shimmer — warmer than C
    const notes = [349.23, 440, 523.25, 698.46, 880];
    notes.forEach((freq, i) => {
      this.playNote({
        freq: jitter(freq, 4),
        patch: PATCH_CHORD,
        env: ENV_PEAK,
        gainPeak: 0.18 - i * 0.022,
        filterFreq: 6500,
        filterQ: 1.0,
        startOffset: i * 0.045, // arpeggio leve
        reverbSend: 0.7,
      });
    });
    // Sparkle layer — bell-like high note pra ressonância
    this.playNote({
      freq: 1760, // A6
      patch: PATCH_BELL,
      env: { attack: 0.005, decay: 0.4, sustain: 0.2, release: 1.0 },
      gainPeak: 0.06,
      filterFreq: 9000,
      filterQ: 2,
      startOffset: 0.18,
      reverbSend: 0.85,
    });
  }

  /** Error: warm low, not punitive. */
  playError() {
    this.playNote({
      freq: jitter(220),
      patch: PATCH_LOW,
      env: ENV_LOW,
      gainPeak: 0.18,
      filterFreq: 1800,
      reverbSend: 0.3,
    });
    this.playNote({
      freq: jitter(165),
      patch: PATCH_LOW,
      env: ENV_LOW,
      gainPeak: 0.12,
      filterFreq: 1800,
      startOffset: 0.06,
      reverbSend: 0.3,
    });
  }

  /** Cancel: 440 → 330 descending fourth. */
  playCancel() {
    this.playNote({
      freq: 440,
      patch: PATCH_PRIMARY,
      env: { attack: 0.008, decay: 0.18, sustain: 0, release: 0.2 },
      gainPeak: 0.14,
      glideTo: 330,
      glideMs: 180,
      filterFreq: 3200,
      reverbSend: 0.35,
    });
  }
}

const globalForSound = globalThis as unknown as { sound?: SoundEngine };
export const sound: SoundEngine =
  globalForSound.sound ?? new SoundEngine();
if (process.env.NODE_ENV !== "production") globalForSound.sound = sound;
