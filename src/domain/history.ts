import type { Sample } from './model';

/** HIS-001 : nombre maximal d'échantillons conservés par patient (une heure simulée). */
export const MAX_HISTORY_SECONDS = 3_600;

/**
 * Ajoute un échantillon à un historique dont l'appelant est propriétaire (mutation en place).
 * Un échantillon de la même seconde remplace le précédent (réévaluation sans avancer le temps).
 */
export function pushSample(history: Sample[], sample: Sample): void {
  const last = history[history.length - 1];
  if (last && last.simulatedSecond === sample.simulatedSecond) {
    history[history.length - 1] = sample;
    return;
  }
  history.push(sample);
  if (history.length > MAX_HISTORY_SECONDS) history.splice(0, history.length - MAX_HISTORY_SECONDS);
}
