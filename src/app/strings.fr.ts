// Chaînes d'interface centralisées (français) pour une traduction ultérieure.

import type { AlarmCause, AlarmState, EventType, MeasureStatus, PatientLevel, SimulatorState, VitalKey } from '../domain/model';

export const t = {
  appName: 'MediMonitor',
  simulationBanner: 'SIMULATION — NE PAS UTILISER POUR DES SOINS',
  disclaimer: 'Simulation pédagogique. Patients fictifs, seuils fictifs non validés médicalement.',
  nav: {
    dashboard: 'Tableau de bord',
    alarms: "Centre d'alarmes",
    journal: 'Journal',
    settings: 'Paramètres',
    main: 'Navigation principale',
  },
  controls: {
    region: 'Contrôles de la simulation',
    start: 'Démarrer',
    pause: 'Pause',
    resume: 'Reprendre',
    reset: 'Réinitialiser',
    speed: 'Vitesse',
    seed: 'Graine',
    seedHelp: 'Modifiable uniquement avant le démarrage.',
    applySeed: 'Appliquer',
    simulatedTime: 'Temps simulé',
    state: 'État',
  },
  patient: {
    scenario: 'Scénario',
    scenarioFor: (label: string) => `Scénario de ${label}`,
    pendingScenario: (id: string) => `→ ${id} au prochain pas`,
    freshness: 'Données',
    neverReceived: 'aucune donnée reçue',
    justNow: "à l'instant",
    secondsAgo: (s: number) => `il y a ${s} s`,
    lastUpdate: 'Dernière mise à jour',
    level: 'État global',
    manual: 'MANUEL',
    details: 'Voir le détail',
    notFound: 'Patient introuvable.',
    back: 'Retour au tableau de bord',
  },
  override: {
    title: 'Interventions manuelles',
    help: "Une valeur imposée reste active jusqu'à sa libération, y compris après un changement de scénario.",
    valueFor: (vital: string) => `Valeur imposée pour ${vital}`,
    set: 'Imposer',
    unavailable: 'Indisponible',
    release: 'Libérer',
    active: 'Override actif',
  },
  alarms: {
    title: "Centre d'alarmes",
    unresolved: 'Alarmes non résolues',
    resolved: 'Historique des alarmes résolues',
    none: 'Aucune alarme non résolue.',
    noneResolved: 'Aucune alarme résolue.',
    acknowledge: 'Acquitter',
    acknowledged: 'Acquittée',
    acknowledgeLabel: (id: string) => `Acquitter l'alarme ${id}`,
    columns: {
      severity: 'Gravité',
      patient: 'Patient',
      vital: 'Mesure',
      cause: 'Cause',
      state: 'État',
      created: 'Déclenchée (s)',
      resolved: 'Résolue (s)',
      action: 'Action',
    },
    patientAlarms: 'Alarmes du patient',
  },
  journal: {
    title: 'Journal des événements',
    patientHistory: 'Historique du patient',
    filterPatient: 'Patient',
    filterType: 'Type',
    filterSeverity: 'Gravité',
    all: 'Tous',
    empty: 'Aucun événement.',
    showMore: 'Afficher plus',
    count: (shown: number, total: number) => `${shown} affichés sur ${total}`,
    columns: { simTime: 'Temps simulé', realTime: 'Horodatage réel', type: 'Type', patient: 'Patient', details: 'Détails' },
  },
  settings: {
    title: 'Paramètres',
    thresholds: 'Seuils pédagogiques',
    thresholdsHelp: 'Seuils fictifs, choisis pour tester les frontières. Ils ne représentent pas des normes cliniques.',
    criticalLow: 'Critique bas (<)',
    warningLow: 'Alerte bas (<)',
    warningHigh: 'Alerte haut (>)',
    criticalHigh: 'Critique haut (>)',
    notApplicable: 'Sans objet',
    save: 'Enregistrer les seuils',
    restore: 'Restaurer les valeurs par défaut',
    saved: 'Seuils enregistrés.',
    restored: 'Seuils par défaut restaurés.',
    invalid: 'Paramétrage refusé :',
    display: "Préférences d'affichage",
    chartWindow: 'Fenêtre des courbes',
    seconds: (s: number) => (s >= 60 ? `${s / 60} min` : `${s} s`),
  },
  charts: {
    title: 'Courbes',
    time: 'Temps simulé (s)',
    gap: 'Les interruptions correspondent à des valeurs invalides ou indisponibles.',
  },
};

export const VITAL_LABELS: Record<VitalKey, string> = {
  heartRate: 'FC',
  spo2: 'SpO2',
  temperature: 'Température',
  systolic: 'PAS',
  diastolic: 'PAD',
};

export const VITAL_LONG_LABELS: Record<VitalKey, string> = {
  heartRate: 'Fréquence cardiaque',
  spo2: 'Saturation en oxygène',
  temperature: 'Température',
  systolic: 'Pression artérielle systolique',
  diastolic: 'Pression artérielle diastolique',
};

export const VITAL_UNITS: Record<VitalKey, string> = {
  heartRate: 'bpm',
  spo2: '%',
  temperature: '°C',
  systolic: 'mmHg',
  diastolic: 'mmHg',
};

export const STATUS_LABELS: Record<Exclude<MeasureStatus, 'VALID'>, string> = {
  INVALID: 'INVALIDE',
  UNAVAILABLE: 'INDISPONIBLE',
};

export const LEVEL_LABELS: Record<PatientLevel, string> = {
  CRITICAL: 'CRITIQUE',
  WARNING: 'ALERTE',
  INFORMATION: 'INFORMATION',
  NORMAL: 'NORMAL',
};

/** Pictogramme redondant avec la couleur (UI-REQ-002). */
export const LEVEL_ICONS: Record<PatientLevel, string> = {
  CRITICAL: '▲▲',
  WARNING: '▲',
  INFORMATION: 'ⓘ',
  NORMAL: '✓',
};

export const CAUSE_LABELS: Record<AlarmCause, string> = {
  LOW: 'Basse',
  HIGH: 'Haute',
  INVALID: 'Donnée invalide',
  UNAVAILABLE: 'Donnée indisponible',
};

export const ALARM_STATE_LABELS: Record<AlarmState, string> = {
  ACTIVE: 'Active',
  ACKNOWLEDGED: 'Acquittée',
  RESOLVED: 'Résolue',
};

export const SIMULATOR_STATE_LABELS: Record<SimulatorState, string> = {
  INITIALIZED: 'Initialisée',
  RUNNING: 'En cours',
  PAUSED: 'En pause',
};

export const EVENT_LABELS: Record<EventType, string> = {
  SIM_STARTED: 'Simulation démarrée',
  SIM_PAUSED: 'Simulation en pause',
  SIM_RESUMED: 'Simulation reprise',
  SIM_RESET: 'Simulation réinitialisée',
  AUTO_PAUSE: 'Pause automatique (onglet masqué)',
  SPEED_CHANGED: 'Vitesse modifiée',
  SCENARIO_CHANGED: 'Scénario modifié',
  MANUAL_OVERRIDE_SET: 'Valeur imposée',
  MANUAL_OVERRIDE_RELEASED: 'Valeur libérée',
  ALARM_CREATED: 'Alarme créée',
  ALARM_ACKNOWLEDGED: 'Alarme acquittée',
  ALARM_RESOLVED: 'Alarme résolue',
  SETTINGS_CHANGED: 'Paramètres modifiés',
};
