// HIS-004 : seuls vitesse, graine, seuils et préférences d'affichage sont persistés.

import type { ChartWindow, Settings, Speed, Thresholds } from '../domain/model';
import { CHART_WINDOWS, SPEEDS } from '../domain/model';
import { DEFAULT_THRESHOLDS, validateThresholds } from '../domain/thresholds';

export const SETTINGS_KEY = 'medimonitor.settings.v1';
export const DEFAULT_SEED = 1234;

export const DEFAULT_SETTINGS: Settings = {
  speed: 1,
  seed: DEFAULT_SEED,
  thresholds: DEFAULT_THRESHOLDS,
  display: { chartWindowSeconds: 300 },
};

function defaultStorage(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

const isSeed = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 0xffffffff;

/** Charge les réglages ; chaque champ absent ou corrompu est remplacé par sa valeur par défaut. */
export function loadSettings(storage: Storage | null = defaultStorage()): Settings {
  let parsed: Record<string, unknown> = {};
  try {
    const raw = storage?.getItem(SETTINGS_KEY);
    const value: unknown = raw ? JSON.parse(raw) : {};
    if (typeof value === 'object' && value !== null) parsed = value as Record<string, unknown>;
  } catch {
    parsed = {};
  }
  const display = (typeof parsed.display === 'object' && parsed.display !== null ? parsed.display : {}) as Record<string, unknown>;
  return {
    speed: SPEEDS.includes(parsed.speed as Speed) ? (parsed.speed as Speed) : DEFAULT_SETTINGS.speed,
    seed: isSeed(parsed.seed) ? parsed.seed : DEFAULT_SETTINGS.seed,
    thresholds: validateThresholds(parsed.thresholds).length === 0 ? (parsed.thresholds as Thresholds) : DEFAULT_THRESHOLDS,
    display: {
      chartWindowSeconds: CHART_WINDOWS.includes(display.chartWindowSeconds as ChartWindow)
        ? (display.chartWindowSeconds as ChartWindow)
        : DEFAULT_SETTINGS.display.chartWindowSeconds,
    },
  };
}

export function saveSettings(settings: Settings, storage: Storage | null = defaultStorage()): void {
  try {
    storage?.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Stockage indisponible (navigation privée, quota) : on continue sans persistance.
  }
}
