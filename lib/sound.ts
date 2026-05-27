/**
 * SoundEngine v3 — usa sons reais do soundcn (Kenney CC0).
 *
 * Cada som é um arquivo .ts com MP3 base64 inline (sem assets externos),
 * decodificado via Web Audio API através do sound-engine.ts do soundcn.
 *
 * Mapeamento:
 * - click-soft       → playPrimary  (botões primários)
 * - notification-pop → playProbeSuccess
 * - success-chime    → playComplete (peak emotional)
 * - error-buzz       → playError
 * - back-001         → playCancel
 * - switch-on/off    → playToggleOn/Off
 * - begin            → playStarted
 */

import { playSound } from "./sound-engine";
import type { SoundAsset } from "./sound-types";

import { successChimeSound } from "./sounds/success-chime";
import { notificationPopSound } from "./sounds/notification-pop";
import { clickSoftSound } from "./sounds/click-soft";
import { switchOnSound } from "./sounds/switch-on";
import { switchOffSound } from "./sounds/switch-off";
import { errorBuzzSound } from "./sounds/error-buzz";
import { back001Sound } from "./sounds/back-001";

class SoundEngine {
  private volume = 0.75;
  private enabled = true;
  private reducedMotion = false;

  setEnabled(v: boolean) {
    this.enabled = v;
  }

  setVolume(v: number) {
    this.volume = Math.max(0, Math.min(1, v));
  }

  setReducedMotion(v: boolean) {
    this.reducedMotion = v;
  }

  private async play(asset: SoundAsset, gainMultiplier = 1) {
    if (!this.enabled || typeof window === "undefined") return;
    const v = this.reducedMotion
      ? this.volume * gainMultiplier * 0.5
      : this.volume * gainMultiplier;
    try {
      await playSound(asset.dataUri, { volume: v });
    } catch {
      // Browser bloqueou (sem user gesture). Ignora silenciosamente.
    }
  }

  playToggleOn() {
    void this.play(switchOnSound, 0.8);
  }
  playToggleOff() {
    void this.play(switchOffSound, 0.8);
  }
  playPrimary() {
    void this.play(clickSoftSound, 1.0);
  }
  playProbeSuccess() {
    void this.play(notificationPopSound, 0.9);
  }
  playComplete() {
    void this.play(successChimeSound, 1.1);
  }
  playError() {
    void this.play(errorBuzzSound, 0.7);
  }
  playCancel() {
    void this.play(back001Sound, 0.7);
  }
}

const globalForSound = globalThis as unknown as { sound?: SoundEngine };
export const sound: SoundEngine =
  globalForSound.sound ?? new SoundEngine();
if (process.env.NODE_ENV !== "production") globalForSound.sound = sound;
