# MediMonitor — Spécification fonctionnelle et technique V1.0

**Statut :** référence de développement initiale (simulation pédagogique, non médicale)  
**Cible :** application web statique, déployable sur GitHub Pages  
**Public :** analystes et testeurs logiciels en formation à Microsoft Copilot et GitHub Copilot  
**Langue de l'interface :** français (chaînes centralisées pour traduction ultérieure)

## 1. Vision, périmètre et exclusions

MediMonitor simule une station centrale de surveillance de **huit patients fictifs fixes**, affichant fréquence cardiaque (FC), saturation en oxygène (SpO2), température et pression artérielle (PA systolique/diastolique). Les valeurs évoluent selon huit scénarios prédéfinis ou des interventions manuelles. L'opérateur peut superviser, mettre en pause, changer la vitesse, consulter les courbes, gérer les alarmes et examiner les événements.

**Exclusions :** connexion à du matériel réel, interprétation clinique, diagnostic, prise de décision médicale, données de santé réelles, authentification, serveur, base distante, synchronisation multiutilisateur, notification sonore obligatoire. Les seuils sont **fictifs, pédagogiques, non validés médicalement**. L'application affiche en permanence « SIMULATION — NE PAS UTILISER POUR DES SOINS ».

## 2. Architecture et technologies

- **Frontend :** React, TypeScript strict, Vite, CSS responsive ; bibliothèque de graphiques compatible React (par exemple Recharts).
- **Hébergement :** GitHub Pages ; aucun appel API externe nécessaire au fonctionnement ; chemins d'assets compatibles avec le `base` Vite du dépôt.
- **Domain core :** fonctions TypeScript pures pour simulation, validation, seuils et transitions d'alarmes ; UI sans logique métier dupliquée.
- **Tests :** Vitest (unitaires), React Testing Library (composants), Playwright (E2E) ; GitHub Actions pour build et tests puis déploiement Pages.
- **Persistance :** `localStorage` uniquement pour les réglages ; aucune donnée de session (mesures, alarmes, journal, temps, interventions) n'est persistée.
- **Temps :** moteur virtuel en pas discrets de 1 seconde simulée ; rendu graphique découplé du calcul.

### 2.1 Structure recommandée

```text
medimonitor/
  docs/specification.md
  public/
  src/
    app/
    components/
    pages/
    domain/
      model.ts
      simulation.ts
      scenarios.ts
      thresholds.ts
      alarms.ts
      events.ts
    data/patients.ts
    state/
    styles/
    main.tsx
  tests/unit/
  tests/integration/
  tests/e2e/
  .github/workflows/
  vite.config.ts
  package.json
```

## 3. Écrans et navigation

**UI-01 Tableau de bord :** huit cartes patient, en grille 4 × 2 sur grand écran et disposition adaptative sur écrans étroits. Chaque carte montre identifiant, quatre constantes (PA affichée `systolique/diastolique`), fraîcheur des données, scénario et niveau d'alarme maximal. L'état `INVALID`/`UNAVAILABLE` est textuel, jamais représenté par zéro.

**UI-02 Détail patient :** courbes temporelles des cinq composantes numériques (FC, SpO2, température, PAS, PAD), scénario courant, dernière mise à jour, contrôles d'injection/libération de valeurs, liste d'alarmes du patient et historique filtré.

**UI-03 Centre d'alarmes :** alarmes non résolues triées par gravité puis date de déclenchement ; badge d'acquittement distinct de la gravité ; historique des alarmes résolues consultable.

**UI-04 Contrôles :** démarrer, pause, reprendre, réinitialiser, vitesse ×1/×5/×10, graine aléatoire et sélection de scénario par patient.

**UI-05 Paramètres :** seuils pédagogiques configurables et restaurables, préférences d'affichage ; validation des seuils avant sauvegarde.

**UI-06 Journal :** chronologie filtrable par patient, type et gravité, avec temps simulé et horodatage réel.

## 4. Données et invariants

### 4.1 Patient

```ts
type PatientId = 'P-001'|'P-002'|'P-003'|'P-004'|'P-005'|'P-006'|'P-007'|'P-008';
type VitalKey = 'heartRate'|'spo2'|'temperature'|'systolic'|'diastolic';
type MeasureStatus = 'VALID'|'INVALID'|'UNAVAILABLE';
type Severity = 'INFORMATION'|'WARNING'|'CRITICAL';
type SimulatorState = 'INITIALIZED'|'RUNNING'|'PAUSED';
type AlarmState = 'ACTIVE'|'ACKNOWLEDGED'|'RESOLVED';
interface Reading { value: number | null; status: MeasureStatus; simulatedSecond: number; }
interface Patient { id: PatientId; label: string; scenarioId: string; }
interface Sample { patientId: PatientId; simulatedSecond: number; readings: Record<VitalKey, Reading>; }
interface ManualOverride { patientId: PatientId; vitalKey: VitalKey; reading: Reading; }
```

Les huit patients sont prédéfinis, avec libellés « Patient 01 » à « Patient 08 ». Pas de création, suppression ou modification d'identité. Le système maintient une série chronologique par patient, une liste d'alarmes et un journal d'événements.

### 4.2 Validation des valeurs

- FC : nombre fini entier entre 0 et 300 bpm.
- SpO2 : nombre fini entier entre 0 et 100 %.
- Température : nombre fini entre 20,0 et 45,0 °C, précision d'un dixième.
- PAS et PAD : nombres finis entiers entre 0 et 300 mmHg, avec PAS > PAD pour une PA valide.
- Toute valeur absente, non numérique, infinie, hors plage, ou PA incohérente est `INVALID`, sans classement clinique ; une donnée non reçue est `UNAVAILABLE`.
- Les deux composantes PA sont validées conjointement : si PAS ≤ PAD, les deux sont `INVALID`.

## 5. Simulation et temps

**SIM-001** Au chargement, état `INITIALIZED`, seconde virtuelle 0, huit patients et mesures initiales déterministes ; aucun tick avant « Démarrer ».

**SIM-002** En `RUNNING`, chaque pas virtuel de 1 s produit exactement un échantillon par patient (8 échantillons), puis évalue les alarmes et enregistre les événements.

**SIM-003** Vitesses ×1, ×5, ×10 : nombre de pas virtuels à exécuter par seconde réelle. Le scheduler accumule le temps réel écoulé et traite les pas entiers dans l'ordre ; il ne saute pas les transitions d'alarme. Le rafraîchissement visuel peut être moins fréquent.

**SIM-004** `Pause` gèle l'horloge virtuelle et toute génération automatique. `Reprendre` continue sans saut temporel. Changer la vitesse ne réinitialise rien.

**SIM-005** `Réinitialiser` remet à zéro le temps, les mesures, alarmes, historiques, scénarios et overrides ; conserve les préférences persistées et la graine configurée ; revient à `INITIALIZED`.

**SIM-006** Pour une même graine, une même configuration et une même suite ordonnée d'actions indexées sur le temps simulé, les échantillons et événements métier sont identiques, indépendamment de la vitesse et de la cadence de rendu. Les horodatages réels sont exclus de cette comparaison.

**SIM-007** Une interruption de l'onglet ou une suspension du navigateur n'entraîne pas de rattrapage massif : si l'onglet devient masqué, le simulateur passe automatiquement en pause et journalise `AUTO_PAUSE`.

**SIM-008** Une intervention manuelle est autorisée à l'état `INITIALIZED`, `RUNNING` ou `PAUSED`. Elle est appliquée immédiatement à l'état visible et évaluée pour les alarmes, sans avancer l'horloge virtuelle ; elle génère un événement distinct.

## 6. Scénarios prédéfinis

Chaque patient possède exactement un scénario actif, modifiable à tout moment. Le changement de scénario prend effet au prochain pas simulé et journalise `SCENARIO_CHANGED`. Les scénarios se calculent à partir de leur seconde locale (0 à l'activation), d'une graine et de valeurs de référence ; ils ne modifient jamais les overrides manuels actifs.

- **SC-01 Stable :** petites variations déterministes dans la zone normale.
- **SC-02 Dégradation progressive :** sur 120 s, FC de 75 à 132 bpm et SpO2 de 98 à 89 % par interpolation linéaire ; autres mesures stables.
- **SC-03 Récupération :** sur 120 s, FC de 132 à 75 et SpO2 de 89 à 98 %, interpolation linéaire.
- **SC-04 Perte de capteur :** SpO2 `UNAVAILABLE` de t=30 à t=59 inclus, puis retour à la normale.
- **SC-05 Valeur aberrante :** à t=45, une température brute de 99 °C est reçue et classée `INVALID`, puis retour normal au pas suivant.
- **SC-06 Alarme intermittente :** FC=110 bpm pendant 10 s puis 80 bpm pendant 10 s, cycle répété à partir de t=0.
- **SC-07 Panne de communication :** toutes les composantes `UNAVAILABLE` de t=30 à t=89 inclus ; reprise ensuite.
- **SC-08 Dégradation rapide :** de t=0 à t=20, FC de 80 à 135 et SpO2 de 98 à 88 %, puis maintien jusqu'à changement de scénario.

Pour toutes les mesures non explicitement affectées, utiliser des valeurs de base fixes : FC 75, SpO2 98, température 36,8, PAS 120, PAD 80. Les interpolations sont arrondies à l'unité pour FC/SpO2/PA et au dixième pour la température. Les bornes de temps sont inclusives comme indiqué. Les huit patients démarrent avec SC-01 ; les autres scénarios sont sélectionnables indépendamment.

## 7. Overrides manuels

**MAN-001** L'opérateur peut imposer une valeur valide ou une entrée invalide/indisponible à une composante d'un patient. Un override persiste **jusqu'à libération explicite**, changement de scénario compris.

**MAN-002** À chaque tick, le moteur calcule la valeur du scénario puis remplace la composante concernée par l'override, avant validation et évaluation des alarmes. Les autres composantes continuent d'évoluer.

**MAN-003** Si PAS/PAD sont modifiées séparément, la paire finale est validée conjointement après application de tous les overrides.

**MAN-004** La libération supprime l'override et applique immédiatement la valeur que le scénario produirait à l'instant virtuel courant, puis réévalue les alarmes sans avancer le temps.

**MAN-005** Les commandes d'injection/libération sont journalisées avec patient, composante, ancienne/nouvelle valeur et temps simulé. Une indication visuelle « MANUEL » apparaît tant que l'override est actif.

## 8. Seuils pédagogiques et classification

Les intervalles ci-dessous sont **fictifs**, ne représentent pas des normes cliniques et sont choisis pour tester les frontières. `INFORMATION` s'applique aux états `INVALID`/`UNAVAILABLE` ; les mesures valides hors seuil sont `WARNING` ou `CRITICAL`.

| Composante | CRITICAL | WARNING | Sinon |
|---|---|---|---|
| FC (bpm) | x < 50 ou x > 120 | 50 ≤ x < 60 ou 100 < x ≤ 120 | NORMAL |
| SpO2 (%) | x < 92 | 92 ≤ x < 95 | NORMAL |
| Température (°C) | x < 35 ou x > 39 | 35 ≤ x < 36 ou 38 < x ≤ 39 | NORMAL |
| PAS (mmHg) | x < 90 ou x > 160 | 90 ≤ x < 100 ou 140 < x ≤ 160 | NORMAL |
| PAD (mmHg) | x < 60 ou x > 100 | 60 ≤ x < 65 ou 90 < x ≤ 100 | NORMAL |

**THR-001** La validation des données précède la classification des seuils. Une mesure invalide ne peut jamais créer une alarme `WARNING` ou `CRITICAL` sur la base de sa valeur brute.

**THR-002** Les seuils sont configurables et sauvegardés localement ; les plages doivent être cohérentes, ordonnées et incluses dans les domaines de validité. Un paramétrage invalide est rejeté avec message explicite.

**THR-003** Changer les seuils déclenche une réévaluation immédiate des dernières mesures sans avancer le temps ; toute transition est journalisée.

**THR-004** L'état global du patient est la sévérité maximale des alarmes non résolues, acquittées comprises ; s'il n'en existe aucune, il est `NORMAL`. Ordre : CRITICAL > WARNING > INFORMATION > NORMAL.

## 9. Cycle de vie des alarmes

Une **condition d'alarme** est identifiée par `(patientId, vitalKey, cause)` où `cause` est `LOW`, `HIGH`, `INVALID` ou `UNAVAILABLE`. Un épisode est créé à la première apparition de la condition, avec identifiant unique, sévérité, début et état `ACTIVE`.

**ALM-001** Une condition persistante ne crée pas de doublon à chaque tick.

**ALM-002** L'acquittement fait passer `ACTIVE` à `ACKNOWLEDGED`, en conservant la condition, la sévérité et la visibilité de l'alarme.

**ALM-003** Lorsque la condition disparaît, l'alarme passe à `RESOLVED`, qu'elle ait été acquittée ou non ; elle quitte la liste active mais reste dans l'historique.

**ALM-004** Une condition réapparue après résolution crée un nouvel épisode, non acquitté.

**ALM-005** Lorsqu'une mesure change de classe/cause (par exemple `HIGH/WARNING` vers `HIGH/CRITICAL`), l'épisode courant est résolu et un nouvel épisode est créé avec la nouvelle sévérité. Pour cela, l'identité effective de l'épisode comprend également la sévérité.

**ALM-006** L'acquittement ne modifie pas la valeur mesurée et n'empêche ni la résolution ni la création d'une alarme différente.

**ALM-007** Les alarmes non résolues sont triées par sévérité décroissante, puis seconde de création croissante, puis identifiant. Une alarme acquittée reste dans cette liste avec marqueur visible.

**ALM-008** Toute création, résolution et tout acquittement est journalisé. Le bouton d'acquittement d'une alarme déjà acquittée est désactivé ; les alarmes résolues ne sont plus acquittables.

## 10. Historique, journal et persistance

**HIS-001** Un échantillon est conservé pour chaque patient et chaque seconde simulée ; l'historique des mesures est limité aux **3 600 dernières secondes simulées par patient**, en supprimant les plus anciens échantillons (buffer circulaire).

**HIS-002** Les événements de journal contiennent `id`, `type`, `patientId?`, `simulatedSecond`, `realTimestamp`, `payload`. Le journal est limité aux **10 000 événements** en mémoire ; en cas de dépassement, les plus anciens sont supprimés.

**HIS-003** Les événements comprennent au minimum : `SIM_STARTED`, `SIM_PAUSED`, `SIM_RESUMED`, `SIM_RESET`, `AUTO_PAUSE`, `SPEED_CHANGED`, `SCENARIO_CHANGED`, `MANUAL_OVERRIDE_SET`, `MANUAL_OVERRIDE_RELEASED`, `ALARM_CREATED`, `ALARM_ACKNOWLEDGED`, `ALARM_RESOLVED`, `SETTINGS_CHANGED`.

**HIS-004** `localStorage` conserve uniquement vitesse choisie, graine, seuils et préférences d'affichage. Les données de session sont perdues au rechargement. Les paramètres absents ou corrompus sont remplacés par les valeurs par défaut sans empêcher le démarrage.

**HIS-005** L'export JSON ou CSV de l'historique et du journal est souhaitable mais **hors périmètre V1.0**.

## 11. Ergonomie et accessibilité

**UI-REQ-001** Dashboard utilisable sur desktop 1366 × 768 sans chevauchement ; responsive sur tablette et mobile (défilement autorisé).

**UI-REQ-002** Couleurs et textes redondants pour les états ; ne jamais dépendre exclusivement de la couleur pour distinguer les alarmes.

**UI-REQ-003** Contrôles accessibles au clavier, labels explicites, focus visible, attributs ARIA pertinents et contrastes adaptés.

**UI-REQ-004** Courbes avec axes, unités et légende ; discontinuités pour valeurs invalides/indisponibles, jamais de points artificiels à zéro.

**UI-REQ-005** Mention de simulation visible sur tous les écrans. Aucune marque GE HealthCare, aucun logo ni apparence propriétaire reproduits.

## 12. Critères d'acceptation Gherkin

### AC-01 Démarrage et pause
```gherkin
Given MediMonitor vient d'être chargé
Then huit patients sont visibles
And le temps simulé vaut 0
When l'opérateur démarre la simulation
Then l'état devient RUNNING
When l'opérateur met en pause
Then le temps et les mesures automatiques cessent de progresser
```

### AC-02 Reproductibilité
```gherkin
Given la graine 1234 et les scénarios par défaut
When j'exécute 120 secondes simulées à vitesse x1
And je note les mesures et transitions d'alarme
And je réinitialise avec la même graine
And j'exécute 120 secondes simulées à vitesse x10
Then les mesures et transitions métier sont identiques
```

### AC-03 Frontière de seuil FC
```gherkin
Given les seuils FC par défaut
When une mesure valide de 120 bpm est évaluée
Then sa classification est WARNING
When une mesure valide de 121 bpm est évaluée
Then sa classification est CRITICAL
When une mesure valide de 100 bpm est évaluée
Then sa classification est NORMAL
```

### AC-04 Override maintenu
```gherkin
Given le patient P-001 utilise le scénario stable
When j'impose manuellement FC = 125 bpm
Then sa FC affichée vaut 125 bpm
And une alarme CRITICAL de FC est active
When 30 secondes simulées passent
Then sa FC reste à 125 bpm
And l'indicateur MANUEL reste visible
When je libère la FC
Then la valeur calculée par le scénario redevient visible
And l'alarme critique se résout si la nouvelle valeur est normale
```

### AC-05 Acquittement
```gherkin
Given une alarme CRITICAL ACTIVE sur P-002
When je l'acquitte
Then son état devient ACKNOWLEDGED
And elle reste visible dans les alarmes non résolues
And l'état global de P-002 reste CRITICAL
```

### AC-06 Résolution sans acquittement
```gherkin
Given une alarme WARNING ACTIVE non acquittée
When la condition redevient normale
Then l'alarme devient RESOLVED
And elle n'apparaît plus parmi les alarmes non résolues
And elle demeure dans l'historique
```

### AC-07 Donnée invalide
```gherkin
Given le patient P-003 est surveillé
When une température brute de 99 degrés est reçue
Then sa température est marquée INVALID
And aucune alarme de seuil de température n'est créée sur la valeur brute
And une alarme INFORMATION de donnée invalide est créée
```

### AC-08 Panne de communication
```gherkin
Given P-004 utilise SC-07 depuis 29 secondes simulées
When le scénario atteint 30 secondes
Then ses cinq composantes deviennent UNAVAILABLE
And les courbes présentent une interruption
When le scénario atteint 90 secondes
Then les composantes reprennent leurs valeurs simulées
And les alarmes d'indisponibilité sont résolues
```

### AC-09 Reset
```gherkin
Given une simulation avec alarmes, overrides et historique
When je réinitialise
Then le temps simulé vaut 0
And aucun override n'est actif
And aucune alarme issue de la session précédente ne subsiste
And les huit patients sont réinitialisés
And les préférences sauvegardées sont conservées
```

### AC-10 Persistance limitée
```gherkin
Given j'ai sélectionné la vitesse x5
And j'ai exécuté la simulation pendant 60 secondes
When je recharge la page
Then la vitesse sélectionnée est x5
And le temps simulé vaut 0
And les alarmes et l'historique précédents sont absents
```

### AC-11 Acquittement sans effet clinique
```gherkin
Given une mesure FC = 125 bpm avec alarme CRITICAL
When j'acquitte l'alarme
Then la mesure FC reste 125 bpm
And la condition critique demeure
```

### AC-12 Valeur de pression incohérente
```gherkin
Given PAS = 120 et PAD = 80
When j'impose PAS = 70 en maintenant PAD = 80
Then la paire de pression artérielle est INVALID
And les deux composantes PA ne sont pas classées sur leurs seuils numériques
And une information de donnée invalide est visible
```

## 13. Tests de référence et qualité

- **Unitaires :** valeurs limites de chaque seuil, valeurs invalides, couples PA incohérents, calcul des scénarios à t=0/29/30/45/59/60/89/90/120, priorité maximale, création/résolution/acquittement, overrides et libération, reproductibilité.
- **Intégration :** ticks → échantillons → alarmes → journal → affichage ; changement de scénario ; changement de seuil ; pause/reprise ; reset.
- **E2E :** affichage huit patients, scénario SC-02, alarme visible et acquittable, maintien d'un override, rechargement avec persistance limitée, rendu GitHub Pages.
- **CI :** lint, contrôle TypeScript, tests unitaires/intégration, build, tests E2E ; déploiement Pages après succès sur branche principale.
- **Qualité :** aucune dépendance réseau obligatoire, aucune erreur console dans les parcours nominaux, aucune donnée patient réelle, fonctionnement dans les versions récentes de Chrome et Edge.

## 14. Ordre de réalisation recommandé

1. Initialiser Vite + React + TypeScript, routes/vues et design system minimal.
2. Implémenter types et données des huit patients.
3. Implémenter le moteur de simulation pur, les huit scénarios et les tests déterministes.
4. Implémenter validation, seuils et moteur d'alarmes avec tests de frontières.
5. Implémenter overrides et transitions d'alarme.
6. Construire dashboard, fiche patient, graphiques et centre d'alarmes.
7. Ajouter journal, paramètres, `localStorage` et accessibilité.
8. Ajouter tests E2E, CI GitHub Actions et déploiement GitHub Pages.

## 15. Conventions et points de vigilance

- Séparer `simulatedSecond` de `realTimestamp` ; ne jamais utiliser `Date.now()` pour calculer une valeur métier simulée.
- Ne pas utiliser `Math.random()` sans générateur pseudo-aléatoire contrôlé par la graine.
- Les scénarios doivent être testables sans navigateur ni React.
- Une alarme acquittée reste non résolue jusqu'à disparition de sa condition.
- L'override manuel a priorité sur le scénario ; il ne doit pas être supprimé lors d'un changement de scénario.
- Aucun défaut volontaire n'est introduit dans V1.0 : les futures branches pédagogiques pourront injecter des anomalies à partir d'une version de référence vérifiée.

---

## Annexe A — Décisions d'implémentation (V1.0)

Interprétations retenues là où la spécification laisse une marge :

| Sujet | Décision |
|---|---|
| SC-02 / SC-03 après t=120 | Maintien des valeurs finales (132/89 et 75/98). |
| SC-06 | `t mod 20 ∈ [0,9]` → FC 110 bpm ; `[10,19]` → 80 bpm. |
| SC-01 | Bruit déterministe sans état `hash(graine, patient, composante, t)` : FC ±3, SpO2 ±1, T ±0,1, PAS ±4, PAD ±3 autour des valeurs de base. |
| Seconde 0 | Un échantillon initial (scénario à t=0) est produit au chargement et au reset, et évalué pour les alarmes, sans tick. |
| Changement de scénario | Mémorisé « en attente » ; appliqué au pas suivant avec seconde locale 0 ; `SCENARIO_CHANGED` journalisé immédiatement. |
| Température | Arrondie au dixième à la validation (37,26 → 37,3). FC, SpO2 et PA non entières sont `INVALID`. |
| Override invalide | Saisie libre : un texte non numérique ou une valeur hors domaine devient `INVALID` ; le bouton « Indisponible » produit `UNAVAILABLE`. |
| Graine | Modifiable uniquement à l'état `INITIALIZED` (garantit SIM-006). |
| Reset | Le journal est vidé puis reçoit `SIM_RESET` ; les identifiants d'alarmes et d'événements repartent de 1. |
| Seuil SpO2 | Pas de seuil haut (« sans objet »). Ordre exigé : critique bas ≤ alerte bas ≤ alerte haut ≤ critique haut, dans le domaine de validité. |
| Fraîcheur | Âge, en secondes simulées, de la dernière seconde où au moins une composante a été reçue. |
| Filtre de gravité du journal | Ne retient que les événements d'alarme de cette gravité. |
| Scheduler | Intervalle de 100 ms ; délai réel plafonné à 1 s par intervalle (pas de rattrapage massif). |
| Routage | `HashRouter` + `base: './'` : fonctionne sur GitHub Pages quel que soit le nom du dépôt. |

## Annexe B — Traçabilité des critères d'acceptation

| Critère | Tests |
|---|---|
| AC-01 | `tests/integration/engine.test.ts` (AC-01), `tests/integration/ui.test.tsx`, `tests/e2e` (AC-01) |
| AC-02 | `tests/integration/engine.test.ts` (AC-02 : 120 pas ×1 vs 12 lots ×10) |
| AC-03 | `tests/unit/thresholds.test.ts` |
| AC-04 | `engine.test.ts`, `ui.test.tsx`, `tests/e2e` (AC-04) |
| AC-05 / AC-11 | `engine.test.ts`, `ui.test.tsx` |
| AC-06 | `engine.test.ts` |
| AC-07 | `engine.test.ts`, `tests/unit/validation.test.ts` |
| AC-08 | `engine.test.ts`, `tests/unit/scenarios.test.ts` |
| AC-09 | `engine.test.ts` |
| AC-10 | `tests/unit/state.test.ts`, `tests/e2e` (AC-10) |
| AC-12 | `engine.test.ts`, `ui.test.tsx`, `validation.test.ts` |
| SIM-007 | `tests/unit/state.test.ts`, `tests/e2e` (SIM-007) |
