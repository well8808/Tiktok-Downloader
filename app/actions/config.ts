"use server";

import { getSettings, setSetting, type AppSettings } from "@/lib/config";
import { setLogRawUrl } from "@/lib/logger";
import { checkAndUpdateYtdlp } from "@/lib/updater";

export async function readSettings() {
  return getSettings();
}

export async function writeSetting<K extends keyof AppSettings>(
  key: K,
  value: AppSettings[K],
) {
  await setSetting(key, value);
  if (key === "logRawUrl") setLogRawUrl(Boolean(value));
  return { ok: true };
}

export async function checkUpdate() {
  return checkAndUpdateYtdlp(true);
}
