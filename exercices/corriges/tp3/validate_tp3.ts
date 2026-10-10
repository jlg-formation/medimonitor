/**
 * MediMonitor — TP3 — Validateur du jeu de données de test (corrigé formateur).
 *
 * Usage :
 *   node validate_tp3.ts [chemin.csv] [--details]
 *
 * Par défaut, valide `medimonitor-test-data-corrige.csv` situé à côté du script.
 * `--details` affiche en plus la classification de chaque mesure.
 * Code de sortie : 0 si tous les contrôles sont PASS, 1 sinon, 2 si le fichier est illisible.
 *
 * Aucune dépendance : Node ≥ 23.6 exécute ce fichier TypeScript directement.
 *
 * Règles appliquées :
 * - Seuils : énoncé TP3 §3 (FC, SpO₂, température, PAS) et spécification TP2 (PAD).
 * - Champ vide = INDISPONIBLE, jamais NORMAL. La valeur `0` est une valeur présente, classée selon les seuils.
 * - Domaines de validité : bornes de saisie manuelle du TP2, appliquées ici aux mesures importées (arbitrage documenté).
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// Référentiel
// ---------------------------------------------------------------------------

const EXPECTED_HEADER = ['patientId', 'timestamp', 'heartRate', 'spo2', 'temperature', 'systolic', 'diastolic'] as const;
const PATIENTS = ['P-001', 'P-002', 'P-003', 'P-004', 'P-005', 'P-006', 'P-007', 'P-008'];
const START_MS = Date.parse('2026-10-10T10:00:00Z');
const MINUTES = 11; // minutes 0 à 10 incluses
const EXPECTED_ROWS = PATIENTS.length * MINUTES;

type MeasureKey = 'heartRate' | 'spo2' | 'temperature' | 'systolic' | 'diastolic';
type Category = 'NORMAL' | 'WARNING' | 'CRITICAL';
type Classification = Category | 'INDISPONIBLE' | 'INVALIDE';

interface MeasureSpec {
  key: MeasureKey;
  label: string;
  integer: boolean;
  /** Domaine de validité (bornes incluses), TP2 CLS-02. */
  domain: [number, number];
  classify: (v: number) => Category;
  /** Valeurs frontières devant apparaître dans le jeu. */
  boundaries: number[];
}

/** Classe une valeur selon une bande NORMAL [lo, hi] et une bande WARNING [warnLo, warnHi] englobante. */
function band(v: number, warnLo: number, lo: number, hi: number, warnHi: number): Category {
  if (v < warnLo || v > warnHi) return 'CRITICAL';
  if (v < lo || v > hi) return 'WARNING';
  return 'NORMAL';
}

const MEASURES: MeasureSpec[] = [
  {
    key: 'heartRate', label: 'FC (bpm)', integer: true, domain: [0, 300],
    // WARNING 50–59 ou 101–120 ; CRITICAL < 50 ou > 120
    classify: (v) => band(v, 50, 60, 100, 120),
    boundaries: [49, 50, 59, 60, 100, 101, 120, 121],
  },
  {
    key: 'spo2', label: 'SpO₂ (%)', integer: true, domain: [0, 100],
    // WARNING 92–94 ; CRITICAL < 92 ; pas de seuil haut
    classify: (v) => band(v, 92, 95, Infinity, Infinity),
    boundaries: [91, 92, 94, 95],
  },
  {
    key: 'temperature', label: 'Température (°C)', integer: false, domain: [20.0, 45.0],
    // WARNING 35,0–35,9 ou 38,1–39,0 ; CRITICAL < 35,0 ou > 39,0 (valeurs au dixième, cf. contrôle de format)
    classify: (v) => band(v, 35.0, 36.0, 38.0, 39.0),
    boundaries: [34.9, 35.0, 35.9, 36.0, 38.0, 38.1, 39.0, 39.1],
  },
  {
    key: 'systolic', label: 'PAS (mmHg)', integer: true, domain: [0, 300],
    // WARNING 90–99 ou 141–160 ; CRITICAL < 90 ou > 160
    classify: (v) => band(v, 90, 100, 140, 160),
    boundaries: [89, 90, 99, 100, 140, 141, 160, 161],
  },
  {
    key: 'diastolic', label: 'PAD (mmHg)', integer: true, domain: [0, 250],
    // Seuils explicites du TP2 : WARNING 60–64 ou 91–100 ; CRITICAL < 60 ou > 100
    classify: (v) => band(v, 60, 65, 90, 100),
    boundaries: [59, 60, 64, 65, 90, 91, 100, 101],
  },
];

const INT_RE = /^-?\d+$/;
const DECIMAL_RE = /^-?\d+\.\d$/; // un chiffre après le point, séparateur décimal obligatoire
const PATIENT_RE = /^P-\d{3}$/;
const TIMESTAMP_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;

// ---------------------------------------------------------------------------
// Modèle et rapport
// ---------------------------------------------------------------------------

interface Row {
  line: number; // numéro de ligne dans le fichier (en-tête = 1)
  raw: Record<string, string>;
  /** Faux si le nombre de champs est incorrect : les colonnes sont alors décalées et les valeurs inexploitables. */
  wellFormed: boolean;
  patientId: string;
  timestampMs: number | null;
  values: Partial<Record<MeasureKey, number | null>>; // null = indisponible ; absent = invalide
  classes: Record<MeasureKey, Classification>;
}

interface CheckResult {
  id: string;
  title: string;
  pass: boolean;
  details: string[];
}

const results: CheckResult[] = [];
const MAX_DETAILS = 8;

function check(id: string, title: string, problems: string[], okDetail?: string): void {
  const details = problems.length > MAX_DETAILS
    ? [...problems.slice(0, MAX_DETAILS), `… et ${problems.length - MAX_DETAILS} autre(s)`]
    : problems;
  results.push({ id, title, pass: problems.length === 0, details: problems.length === 0 && okDetail ? [okDetail] : details });
}

function minuteLabel(ms: number): string {
  return new Date(ms).toISOString().slice(11, 16);
}

// ---------------------------------------------------------------------------
// 1. Chargement et schéma
// ---------------------------------------------------------------------------

const scriptDir = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const showDetails = args.includes('--details');
const csvPath = args.find((a) => !a.startsWith('--')) ?? join(scriptDir, 'medimonitor-test-data-corrige.csv');

let content: string;
try {
  content = readFileSync(csvPath, 'utf8');
} catch (err) {
  console.error(`Impossible de lire ${csvPath} : ${(err as Error).message}`);
  process.exit(2);
}

const withoutBom = content.charCodeAt(0) === 0xfeff ? content.slice(1) : content;
const lines = withoutBom.split(/\r?\n/);
while (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();

const header = (lines[0] ?? '').split(',');
const schemaProblems: string[] = [];
if (header.join(',') !== EXPECTED_HEADER.join(',')) {
  schemaProblems.push(`En-tête attendu : ${EXPECTED_HEADER.join(',')}`);
  schemaProblems.push(`En-tête trouvé  : ${header.join(',')}`);
}
const missingColumns = EXPECTED_HEADER.filter((c) => !header.includes(c));

const rows: Row[] = [];
const blankLines: number[] = [];
lines.slice(1).forEach((text, i) => {
  const lineNo = i + 2;
  if (text.trim() === '') {
    blankLines.push(lineNo);
    return;
  }
  const fields = text.split(',');
  if (fields.length !== header.length) {
    schemaProblems.push(`Ligne ${lineNo} : ${fields.length} champ(s) au lieu de ${header.length}`);
  }
  const raw: Record<string, string> = {};
  header.forEach((name, idx) => { raw[name] = fields[idx] ?? ''; });
  rows.push({
    line: lineNo,
    raw,
    wellFormed: fields.length === header.length,
    patientId: raw.patientId ?? '',
    timestampMs: null,
    values: {},
    classes: {} as Record<MeasureKey, Classification>,
  });
});
if (blankLines.length > 0) schemaProblems.push(`Ligne(s) vide(s) : ${blankLines.join(', ')}`);

check('SCH-01', 'Schéma CSV (7 colonnes dans l\'ordre, séparateur virgule)', schemaProblems,
  `${header.length} colonnes conformes, ${rows.length} lignes de données`);

if (missingColumns.length > 0) {
  // Sans les colonnes obligatoires, les contrôles suivants n'ont pas de sens.
  check('SCH-02', 'Colonnes obligatoires présentes', [`Colonne(s) manquante(s) : ${missingColumns.join(', ')}`]);
  printReport();
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 3. Formats et domaines (avant les contrôles de volumétrie, qui en dépendent)
// ---------------------------------------------------------------------------

const formatProblems: string[] = [];
const domainProblems: string[] = [];

for (const row of rows) {
  if (!PATIENT_RE.test(row.patientId)) {
    formatProblems.push(`Ligne ${row.line} : patientId "${row.patientId}" invalide (attendu P-001 à P-008)`);
  }

  const ts = row.raw.timestamp ?? '';
  const ms = TIMESTAMP_RE.test(ts) ? Date.parse(ts) : NaN;
  // Date.parse accepte 2026-02-30 : on vérifie l'aller-retour pour rejeter les dates impossibles.
  if (Number.isNaN(ms) || new Date(ms).toISOString().replace('.000', '') !== ts) {
    formatProblems.push(`Ligne ${row.line} : timestamp "${ts}" invalide (attendu ISO 8601 UTC, ex. 2026-10-10T10:05:00Z)`);
  } else {
    row.timestampMs = ms;
  }

  for (const m of MEASURES) {
    if (!row.wellFormed) {
      // Déjà signalé par SCH-01 : on n'interprète pas des colonnes décalées.
      row.classes[m.key] = 'INVALIDE';
      continue;
    }
    const cell = row.raw[m.key] ?? '';
    if (cell === '') {
      // Champ vide strict : mesure indisponible (et non zéro).
      row.values[m.key] = null;
      row.classes[m.key] = 'INDISPONIBLE';
      continue;
    }
    const valid = m.integer ? INT_RE.test(cell) : DECIMAL_RE.test(cell);
    if (!valid) {
      formatProblems.push(`Ligne ${row.line} (${row.patientId}) : ${m.key}="${cell}" — ${m.integer ? 'entier attendu' : 'décimal à un chiffre après le point attendu'}`);
      row.classes[m.key] = 'INVALIDE';
      continue;
    }
    const v = Number(cell);
    if (v < m.domain[0] || v > m.domain[1]) {
      domainProblems.push(`Ligne ${row.line} (${row.patientId}) : ${m.key}=${cell} hors domaine [${m.domain[0]} ; ${m.domain[1]}]`);
      row.classes[m.key] = 'INVALIDE';
      continue;
    }
    row.values[m.key] = v;
    row.classes[m.key] = m.classify(v);
  }
}

// ---------------------------------------------------------------------------
// 2. Volumétrie : 88 enregistrements, 8 patients, 11 horodatages par patient
// ---------------------------------------------------------------------------

check('VOL-01', `Nombre d'enregistrements = ${EXPECTED_ROWS}`,
  rows.length === EXPECTED_ROWS ? [] : [`${rows.length} enregistrement(s) trouvé(s)`],
  `${rows.length} enregistrements`);

const byPatient = new Map<string, Row[]>();
for (const row of rows) {
  const list = byPatient.get(row.patientId) ?? [];
  list.push(row);
  byPatient.set(row.patientId, list);
}

const patientProblems: string[] = [];
const missingPatients = PATIENTS.filter((p) => !byPatient.has(p));
const unknownPatients = [...byPatient.keys()].filter((p) => !PATIENTS.includes(p));
if (missingPatients.length > 0) patientProblems.push(`Patient(s) absent(s) : ${missingPatients.join(', ')}`);
if (unknownPatients.length > 0) patientProblems.push(`Patient(s) inattendu(s) : ${unknownPatients.map((p) => `"${p}"`).join(', ')}`);
check('VOL-02', 'Exactement 8 patients P-001 à P-008', patientProblems, PATIENTS.join(', '));

const timelineProblems: string[] = [];
const expectedTimes = Array.from({ length: MINUTES }, (_, i) => START_MS + i * 60_000);
for (const p of PATIENTS) {
  const list = byPatient.get(p);
  if (!list) continue;
  const times = list.map((r) => r.timestampMs);
  if (list.length !== MINUTES) timelineProblems.push(`${p} : ${list.length} enregistrement(s) au lieu de ${MINUTES}`);
  const missing = expectedTimes.filter((t) => !times.includes(t));
  if (missing.length > 0) timelineProblems.push(`${p} : minute(s) manquante(s) ${missing.map(minuteLabel).join(', ')}`);
  const extra = list.filter((r) => r.timestampMs !== null && !expectedTimes.includes(r.timestampMs));
  for (const r of extra) timelineProblems.push(`${p} : horodatage hors plage 10:00–10:10 (ligne ${r.line}, ${r.raw.timestamp})`);
  const valid = times.filter((t): t is number => t !== null);
  if (valid.some((t, i) => i > 0 && t <= (valid[i - 1] as number))) {
    timelineProblems.push(`${p} : enregistrements non ordonnés chronologiquement`);
  }
}
check('VOL-03', '11 horodatages par patient, 10:00 à 10:10 UTC, ordonnés à la minute', timelineProblems,
  '8 × 11 instants consécutifs');

// ---------------------------------------------------------------------------
// 3 (suite). Doublons, formats, domaines, cohérence PAS/PAD
// ---------------------------------------------------------------------------

const dupProblems: string[] = [];
const seen = new Map<string, number>();
for (const row of rows) {
  const key = `${row.patientId}|${row.raw.timestamp}`;
  const first = seen.get(key);
  if (first !== undefined) dupProblems.push(`(${row.patientId}, ${row.raw.timestamp}) en lignes ${first} et ${row.line}`);
  else seen.set(key, row.line);
}
check('DUP-01', 'Unicité des couples (patientId, timestamp)', dupProblems, `${seen.size} couples distincts`);

check('FMT-01', 'Formats valides (identifiant, ISO 8601 UTC, entiers, décimal à point)', formatProblems);
check('FMT-02', 'Valeurs dans les domaines de validité TP2', domainProblems);

const bpProblems: string[] = [];
for (const row of rows) {
  const sys = row.values.systolic;
  const dia = row.values.diastolic;
  if (typeof sys === 'number' && typeof dia === 'number' && sys <= dia) {
    bpProblems.push(`Ligne ${row.line} (${row.patientId}) : PAS ${sys} ≤ PAD ${dia}`);
  }
}
check('COH-01', 'Cohérence pression artérielle : PAS > PAD', bpProblems);

// ---------------------------------------------------------------------------
// 4. Classification de chaque mesure
// ---------------------------------------------------------------------------

const ordered = [...byPatient.entries()]
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([p, list]) => [p, [...list].sort((a, b) => (a.timestampMs ?? 0) - (b.timestampMs ?? 0))] as const);

function series(list: readonly Row[], key: MeasureKey): Classification[] {
  return list.map((r) => r.classes[key]);
}

const counts: Record<MeasureKey, Record<Classification, number>> = {} as never;
for (const m of MEASURES) {
  counts[m.key] = { NORMAL: 0, WARNING: 0, CRITICAL: 0, INDISPONIBLE: 0, INVALIDE: 0 };
  for (const row of rows) counts[m.key][row.classes[m.key]]++;
}
const classificationSummary = MEASURES.map((m) => {
  const c = counts[m.key];
  return `${m.label.padEnd(17)} N=${c.NORMAL}  W=${c.WARNING}  C=${c.CRITICAL}  indispo=${c.INDISPONIBLE}  invalide=${c.INVALIDE}`;
});
const unclassified = MEASURES.reduce((n, m) => n + counts[m.key].INVALIDE, 0);
results.push({
  id: 'CLS-01',
  title: 'Classification de chaque mesure (NORMAL / WARNING / CRITICAL / INDISPONIBLE)',
  pass: unclassified === 0,
  details: unclassified === 0
    ? classificationSummary
    : [...classificationSummary, `${unclassified} mesure(s) non classable(s) (format ou domaine invalide)`],
});

// ---------------------------------------------------------------------------
// 5. Contraintes de couverture
// ---------------------------------------------------------------------------

/** Vrai si la séquence contient `pattern` comme sous-suite (dans l'ordre, pas forcément contiguë). */
function hasSubsequence(seq: Classification[], pattern: Classification[]): boolean {
  let i = 0;
  for (const c of seq) if (c === pattern[i] && ++i === pattern.length) return true;
  return false;
}

/** Couples de valeurs disponibles consécutives (en ignorant les mesures indisponibles ou invalides). */
function consecutivePairs(list: readonly Row[], key: MeasureKey): [number, number, Row][] {
  const pairs: [number, number, Row][] = [];
  let prev: number | null = null;
  for (const r of list) {
    const v = r.values[key];
    if (typeof v !== 'number') continue;
    if (prev !== null) pairs.push([prev, v, r]);
    prev = v;
  }
  return pairs;
}

function crosses(a: number, b: number, threshold: number): boolean {
  // Franchissement entre `threshold - 1` et `threshold` (dans un sens ou dans l'autre).
  return (a < threshold && b >= threshold) || (a >= threshold && b < threshold);
}

// CV-04 — au moins un patient NORMAL sur toutes les mesures, aux 11 instants
const stablePatients = ordered
  .filter(([, list]) => list.length === MINUTES && list.every((r) => MEASURES.every((m) => r.classes[m.key] === 'NORMAL')))
  .map(([p]) => p);
check('COV-01', 'Au moins un patient NORMAL pendant les 10 minutes',
  stablePatients.length > 0 ? [] : ['Aucun patient entièrement NORMAL sur les 11 instants'],
  `Patient(s) : ${stablePatients.join(', ')}`);

// CV-11 — dégradation progressive NORMAL → WARNING → CRITICAL puis récupération (retour à NORMAL)
const degradations: string[] = [];
for (const [p, list] of ordered) {
  for (const m of MEASURES) {
    if (hasSubsequence(series(list, m.key), ['NORMAL', 'WARNING', 'CRITICAL', 'WARNING', 'NORMAL'])) degradations.push(`${p}/${m.key}`);
  }
}
check('COV-02', 'Dégradation NORMAL → WARNING → CRITICAL puis récupération',
  degradations.length > 0 ? [] : ['Aucune trajectoire N → W → C → W → N sur une même mesure'],
  degradations.join(', '));

// Franchissement d'un seuil de FC (changement de catégorie entre deux mesures consécutives)
const hrCrossings: string[] = [];
for (const [p, list] of ordered) {
  for (const [a, b, r] of consecutivePairs(list, 'heartRate')) {
    const spec = MEASURES[0] as MeasureSpec;
    if (spec.classify(a) !== spec.classify(b)) hrCrossings.push(`${p} ${a}→${b} à ${r.raw.timestamp?.slice(11, 16)}`);
  }
}
check('COV-03', 'Au moins un patient traverse un seuil de FC',
  hrCrossings.length > 0 ? [] : ['Aucun changement de catégorie de FC entre deux mesures consécutives'],
  `${hrCrossings.length} franchissement(s), ex. ${hrCrossings.slice(0, 3).join(' ; ')}`);

// Un même patient traverse les seuils SpO₂ 94/95 et 91/92
const spo2Patients = ordered
  .filter(([, list]) => {
    const pairs = consecutivePairs(list, 'spo2');
    return pairs.some(([a, b]) => crosses(a, b, 95)) && pairs.some(([a, b]) => crosses(a, b, 92));
  })
  .map(([p]) => p);
check('COV-04', 'Au moins un patient traverse les seuils SpO₂ 94/95 et 91/92',
  spo2Patients.length > 0 ? [] : ['Aucun patient ne franchit à la fois 94/95 et 91/92'],
  `Patient(s) : ${spo2Patients.join(', ')}`);

// Température et systolique anormales
for (const [id, key, label] of [['COV-05', 'temperature', 'température'], ['COV-06', 'systolic', 'systolique']] as const) {
  const c = counts[key];
  const problems: string[] = [];
  if (c.WARNING + c.CRITICAL === 0) problems.push(`Aucune ${label} anormale`);
  else {
    if (c.WARNING === 0) problems.push(`Aucune ${label} WARNING (recommandé)`);
    if (c.CRITICAL === 0) problems.push(`Aucune ${label} CRITICAL (recommandé)`);
  }
  check(id, `Au moins une ${label} anormale (WARNING et CRITICAL)`, problems, `WARNING=${c.WARNING}, CRITICAL=${c.CRITICAL}`);
}

// Mesure indisponible conservée sur sa ligne, puis retour de la mesure
const unavailable: string[] = [];
const returned: string[] = [];
for (const [p, list] of ordered) {
  for (const m of MEASURES) {
    list.forEach((r, i) => {
      if (r.classes[m.key] !== 'INDISPONIBLE') return;
      unavailable.push(`${p}/${m.key} à ${r.raw.timestamp?.slice(11, 16)}`);
      if (list.slice(i + 1).some((n) => typeof n.values[m.key] === 'number')) returned.push(`${p}/${m.key}`);
    });
  }
}
check('COV-07', 'Au moins une mesure indisponible (champ vide, ligne conservée)',
  unavailable.length > 0 ? [] : ['Aucun champ vide : la perte de mesure n\'est pas couverte'],
  unavailable.join(', '));
check('COV-08', 'Retour d\'une mesure après indisponibilité',
  returned.length > 0 ? [] : ['Aucune mesure ne redevient disponible après un champ vide'],
  [...new Set(returned)].join(', '));

// Valeurs exactement aux frontières, pour chaque mesure
for (const m of MEASURES) {
  const present = new Set(rows.map((r) => r.values[m.key]).filter((v): v is number => typeof v === 'number'));
  const missing = m.boundaries.filter((b) => !present.has(b));
  check(`BND-${m.key}`, `Valeurs frontières ${m.label} : ${m.boundaries.join(' / ')}`,
    missing.length > 0 ? [`Frontière(s) absente(s) : ${missing.join(', ')}`] : [], 'Toutes présentes');
}

// PAD : les trois catégories sont représentées (seuils TP2)
const dia = counts.diastolic;
const diaMissing = (['NORMAL', 'WARNING', 'CRITICAL'] as const).filter((c) => dia[c] === 0);
check('COV-09', 'PAD testée selon TP2 : NORMAL, WARNING et CRITICAL présents',
  diaMissing.length > 0 ? [`Catégorie(s) PAD absente(s) : ${diaMissing.join(', ')}`] : [],
  `N=${dia.NORMAL}, W=${dia.WARNING}, C=${dia.CRITICAL}`);

// ---------------------------------------------------------------------------
// 6. Rapport
// ---------------------------------------------------------------------------

printReport();
process.exit(results.every((r) => r.pass) ? 0 : 1);

function printReport(): void {
  const symbol: Record<Classification, string> = { NORMAL: '.', WARNING: 'W', CRITICAL: 'C', INDISPONIBLE: '_', INVALIDE: '!' };

  console.log('='.repeat(78));
  console.log('MediMonitor — TP3 — Validation du jeu de données');
  console.log(`Fichier : ${csvPath}`);
  console.log('='.repeat(78));

  if (rows.length > 0 && rows[0]?.classes.heartRate !== undefined) {
    console.log('\nChronogramme des catégories (. NORMAL  W WARNING  C CRITICAL  _ indisponible  ! invalide)');
    console.log(`${''.padEnd(8)}${MEASURES.map((m) => m.key.padEnd(13)).join('')}`);
    for (const [p, list] of [...byPatient.entries()].sort(([a], [b]) => a.localeCompare(b))) {
      const cols = MEASURES.map((m) => list.map((r) => symbol[r.classes[m.key]]).join('').padEnd(13));
      console.log(`${p.padEnd(8)}${cols.join('')}`);
    }

    if (showDetails) {
      console.log('\nDétail des mesures');
      for (const row of rows) {
        const cells = MEASURES.map((m) => `${m.key}=${row.raw[m.key] === '' ? '∅' : row.raw[m.key]}:${row.classes[m.key]}`);
        console.log(`  L${String(row.line).padStart(3)} ${row.patientId} ${row.raw.timestamp}  ${cells.join('  ')}`);
      }
    }
  }

  console.log('\nContrôles');
  for (const r of results) {
    console.log(`  [${r.pass ? 'PASS' : 'FAIL'}] ${r.id.padEnd(16)} ${r.title}`);
    for (const d of r.details) console.log(`         ${''.padEnd(16)} ${r.pass ? '' : '→ '}${d}`);
  }

  const failed = results.filter((r) => !r.pass);
  console.log('\n' + '-'.repeat(78));
  console.log(failed.length === 0
    ? `RÉSULTAT GLOBAL : PASS (${results.length}/${results.length} contrôles)`
    : `RÉSULTAT GLOBAL : FAIL (${failed.length} contrôle(s) en échec sur ${results.length} : ${failed.map((r) => r.id).join(', ')})`);
  console.log('-'.repeat(78));
}
