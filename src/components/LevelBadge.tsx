import type { PatientLevel } from '../domain/model';
import { LEVEL_ICONS, LEVEL_LABELS } from '../app/strings.fr';

/** Badge de gravité : couleur + pictogramme + texte (jamais la couleur seule). */
export function LevelBadge({ level }: { level: PatientLevel }) {
  return (
    <span className={`badge level-${level.toLowerCase()}`}>
      <span aria-hidden="true">{LEVEL_ICONS[level]}</span> {LEVEL_LABELS[level]}
    </span>
  );
}
