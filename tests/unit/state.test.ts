import { describe, expect, it } from 'vitest';
import { DEFAULT_THRESHOLDS } from '../../src/domain/thresholds';
import { createStepAccumulator, MAX_FRAME_MS } from '../../src/state/scheduler';
import { DEFAULT_SETTINGS, loadSettings, saveSettings, SETTINGS_KEY } from '../../src/state/settingsStorage';

function memoryStorage(initial?: string): Storage {
  const data = new Map<string, string>();
  if (initial !== undefined) data.set(SETTINGS_KEY, initial);
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (k) => data.get(k) ?? null,
    key: (i) => [...data.keys()][i] ?? null,
    removeItem: (k) => void data.delete(k),
    setItem: (k, v) => void data.set(k, v),
  };
}

describe('settingsStorage (HIS-004)', () => {
  it('renvoie les valeurs par défaut si rien n’est stocké', () => {
    expect(loadSettings(memoryStorage())).toEqual(DEFAULT_SETTINGS);
    expect(loadSettings(null)).toEqual(DEFAULT_SETTINGS);
  });

  it('relit ce qui a été sauvegardé', () => {
    const storage = memoryStorage();
    const thresholds = structuredClone(DEFAULT_THRESHOLDS);
    thresholds.heartRate.criticalHigh = 130;
    const settings = { speed: 5 as const, seed: 99, thresholds, display: { chartWindowSeconds: 60 as const } };
    saveSettings(settings, storage);
    expect(loadSettings(storage)).toEqual(settings);
  });

  it('ne persiste que les réglages', () => {
    const storage = memoryStorage();
    saveSettings(DEFAULT_SETTINGS, storage);
    expect(Object.keys(JSON.parse(storage.getItem(SETTINGS_KEY) ?? '{}')).sort()).toEqual(['display', 'seed', 'speed', 'thresholds']);
  });

  it.each([
    ['JSON corrompu', '{oops'],
    ['type inattendu', '42'],
    ['null', 'null'],
  ])('remplace un contenu %s par les valeurs par défaut', (_label, raw) => {
    expect(loadSettings(memoryStorage(raw))).toEqual(DEFAULT_SETTINGS);
  });

  it('remplace champ par champ les valeurs invalides', () => {
    const bad = structuredClone(DEFAULT_THRESHOLDS);
    bad.spo2.criticalLow = 200;
    const raw = JSON.stringify({ speed: 3, seed: 7, thresholds: bad, display: { chartWindowSeconds: 12 } });
    expect(loadSettings(memoryStorage(raw))).toEqual({ ...DEFAULT_SETTINGS, seed: 7 });
  });

  it('ignore un stockage qui lève une exception', () => {
    const throwing = { ...memoryStorage(), getItem: () => { throw new Error('denied'); }, setItem: () => { throw new Error('quota'); } };
    expect(loadSettings(throwing)).toEqual(DEFAULT_SETTINGS);
    expect(() => saveSettings(DEFAULT_SETTINGS, throwing)).not.toThrow();
  });
});

describe('scheduler (SIM-003, SIM-007)', () => {
  it('produit `speed` pas par seconde réelle quel que soit le découpage', () => {
    for (const speed of [1, 5, 10] as const) {
      const acc = createStepAccumulator();
      let steps = 0;
      for (let i = 0; i < 100; i++) steps += acc.advance(100, speed);
      expect(steps).toBe(10 * speed);
    }
  });

  it('accumule les fractions de pas', () => {
    const acc = createStepAccumulator();
    expect(acc.advance(400, 1)).toBe(0);
    expect(acc.advance(400, 1)).toBe(0);
    expect(acc.advance(400, 1)).toBe(1);
  });

  it('ne rattrape pas massivement après une longue suspension', () => {
    const acc = createStepAccumulator();
    expect(acc.advance(60_000, 10)).toBe((MAX_FRAME_MS / 1000) * 10);
    expect(acc.advance(-5, 10)).toBe(0);
  });
});
