// SIM-003 : convertit le temps réel écoulé en nombre entier de pas virtuels.
// Le calcul des pas est découplé du rendu ; le reducer traite chaque pas dans l'ordre.

import type { Speed } from '../domain/model';

/** Au-delà de ce délai réel entre deux appels, on ne rattrape pas (SIM-007). */
export const MAX_FRAME_MS = 1_000;

export interface StepAccumulator {
  /** Renvoie le nombre de pas entiers à exécuter pour `elapsedMs` de temps réel. */
  advance(elapsedMs: number, speed: Speed): number;
  reset(): void;
}

export function createStepAccumulator(): StepAccumulator {
  let pending = 0;
  return {
    advance(elapsedMs, speed) {
      const clamped = Math.min(Math.max(elapsedMs, 0), MAX_FRAME_MS);
      pending += (clamped / 1000) * speed;
      const steps = Math.floor(pending + 1e-9);
      pending -= steps;
      return steps;
    },
    reset() {
      pending = 0;
    },
  };
}
