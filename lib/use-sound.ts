"use client";

import { useEffect, useState } from "react";
import { sound } from "./sound";

type SoundPrefs = {
  soundEnabled: boolean;
  soundVolume: number; // 0..100
  confettiEnabled: boolean;
};

const DEFAULTS: SoundPrefs = {
  soundEnabled: true,
  soundVolume: 60,
  confettiEnabled: true,
};

const STORAGE_KEY = "ttdl:sound-prefs";

let cachedPrefs: SoundPrefs = DEFAULTS;
const listeners = new Set<(p: SoundPrefs) => void>();

function readFromStorage(): SoundPrefs {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw);
    return {
      soundEnabled:
        typeof parsed.soundEnabled === "boolean"
          ? parsed.soundEnabled
          : DEFAULTS.soundEnabled,
      soundVolume:
        typeof parsed.soundVolume === "number"
          ? parsed.soundVolume
          : DEFAULTS.soundVolume,
      confettiEnabled:
        typeof parsed.confettiEnabled === "boolean"
          ? parsed.confettiEnabled
          : DEFAULTS.confettiEnabled,
    };
  } catch {
    return DEFAULTS;
  }
}

function applyToEngine(prefs: SoundPrefs) {
  sound.setEnabled(prefs.soundEnabled);
  sound.setVolume(prefs.soundVolume / 100);
}

export function getSoundPrefs(): SoundPrefs {
  return cachedPrefs;
}

export function setSoundPrefs(next: Partial<SoundPrefs>) {
  cachedPrefs = { ...cachedPrefs, ...next };
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedPrefs));
    } catch {
      // ignore quota errors
    }
  }
  applyToEngine(cachedPrefs);
  listeners.forEach((l) => l(cachedPrefs));
}

export function useSoundPrefs(): SoundPrefs {
  const [prefs, setPrefs] = useState<SoundPrefs>(cachedPrefs);
  useEffect(() => {
    const loaded = readFromStorage();
    cachedPrefs = loaded;
    applyToEngine(loaded);
    setPrefs(loaded);
    const listener = (p: SoundPrefs) => setPrefs(p);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);
  return prefs;
}

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      setReduced(mq.matches);
      sound.setReducedMotion(mq.matches);
    };
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}
