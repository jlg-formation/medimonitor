# MediMonitor — TP3 : Génération et validation de données de test

**Document A — Énoncé stagiaire**  
**Version :** 1.0 · **Durée indicative :** 60 minutes  
**Outils :** Microsoft Copilot, éditeur de texte, Python ou TypeScript (au choix)

## 1. Contexte

MediMonitor est un simulateur pédagogique de surveillance de huit patients fictifs, identifiés de `P-001` à `P-008`. Il suit la fréquence cardiaque (FC), la saturation en oxygène (SpO₂), la température, ainsi que les pressions artérielles systolique et diastolique.

Vous intervenez comme analyste/testeur. Votre mission consiste à produire des **données synthétiques** destinées à éprouver les règles de classification des mesures et les transitions d'alarmes. Vous ne devez pas utiliser de données de patients réels. Le TP se déroule **sans lancer ni modifier l'application**.

## 2. Objectifs pédagogiques

À l'issue du TP, vous devez être capable de :

1. Déduire des classes d'équivalence et des valeurs limites à partir d'exigences.
2. Demander à Copilot de générer un jeu de données reproductible et exploitable.
3. Distinguer données aléatoires, données plausibles et données couvrant les exigences.
4. Vérifier automatiquement la structure, la chronologie et la couverture d'un jeu de données.
5. Identifier et corriger les erreurs ou hypothèses introduites par une IA.

## 3. Référence fonctionnelle

Utilisez en priorité la **spécification validée du TP2 (document A)** pour les règles applicables. Pour ce TP, les seuils de référence suivants permettent de vérifier les données générées :

| Mesure | Unité | WARNING | CRITICAL |
|---|---|---|---|
| Fréquence cardiaque | bpm | 50 à 59 ou 101 à 120 | < 50 ou > 120 |
| SpO₂ | % | 92 à 94 | < 92 |
| Température | °C | 35,0 à 35,9 ou 38,1 à 39,0 | < 35,0 ou > 39,0 |
| Pression systolique | mmHg | 90 à 99 ou 141 à 160 | < 90 ou > 160 |

Les valeurs non couvertes par WARNING ou CRITICAL sont considérées **NORMAL** pour la mesure concernée. Pour la pression diastolique, référez-vous exclusivement aux règles explicites du document TP2 : **n'inventez aucun seuil**. Une valeur absente est **INDISPONIBLE**, jamais NORMAL par défaut.

> **Important :** ces seuils sont des règles du simulateur fictif, pas des recommandations médicales.

## 4. Travail demandé

### Étape 1 — Construire le plan de couverture (10 min)

À partir de la spécification TP2, identifiez les partitions et valeurs frontières utiles. Préparez une courte liste des cas à couvrir : NORMAL, WARNING, CRITICAL, mesure indisponible, franchissement d'un seuil, aggravation et retour à la normale. Précisez les règles qui ne peuvent pas être déduites du document.

### Étape 2 — Générer le CSV avec Copilot (15 min)

Demandez à Copilot de produire un jeu de données pour les **8 patients** sur **10 minutes simulées**, avec **une mesure par patient et par minute**, minutes 0 à 10 incluses, soit **88 enregistrements**.

Le fichier doit s'appeler `medimonitor_tp3_mesures.csv`. Utilisez une graine (`seed`) explicite si vous passez par un générateur de nombres pseudo-aléatoires. Les données doivent être entièrement fictives.

**Colonnes obligatoires :**

| Colonne | Type / format | Exemple |
|---|---|---|
| `patientId` | chaîne `P-001` à `P-008` | `P-003` |
| `timestamp` | ISO 8601 UTC | `2026-10-10T10:05:00Z` |
| `heartRate` | entier ou vide | `125` |
| `spo2` | entier ou vide | `91` |
| `temperature` | nombre décimal ou vide | `38.5` |
| `systolic` | entier ou vide | `145` |
| `diastolic` | entier ou vide | `95` |

Choisissez `2026-10-10T10:00:00Z` comme instant initial. Un champ vide représente une mesure indisponible. Utilisez la virgule comme séparateur CSV et le point comme séparateur décimal.

**Contraintes de couverture :**

- Chaque patient possède exactement 11 enregistrements, ordonnés à la minute.
- Au moins un patient reste dans un état normal pendant les 10 minutes.
- Au moins un patient présente une dégradation progressive NORMAL → WARNING → CRITICAL, puis une récupération.
- Au moins un patient traverse un seuil de fréquence cardiaque.
- Au moins un patient traverse les seuils de SpO₂ à **94/95** et **91/92**.
- Le jeu contient au moins un cas de température anormale et un cas de systolique anormale.
- Au moins une mesure est indisponible, sans supprimer la ligne CSV.
- Le jeu comporte des valeurs **exactement aux frontières** des catégories, et pas seulement des valeurs très éloignées des seuils.
- Évitez les variations incohérentes avec le scénario annoncé ; aucune plausibilité médicale réelle n'est exigée.

### Étape 3 — Contrôler le jeu généré (10 min)

Examinez le CSV. Vérifiez les colonnes, le nombre de lignes, l'unicité des couples (`patientId`, `timestamp`), les formats, les horodatages et la présence des scénarios attendus.

Repérez au moins **trois risques de qualité** possibles dans les données proposées par Copilot, même si votre fichier final ne les présente plus.

### Étape 4 — Générer un validateur (15 min)

Avec Copilot, produisez un script `validate_tp3.py` **ou** `validate_tp3.ts` qui :

1. Charge le CSV et vérifie son schéma.
2. Contrôle les 88 enregistrements, les 8 patients et les 11 horodatages par patient.
3. Détecte les doublons et les formats invalides.
4. Classe chaque mesure selon les seuils explicitement spécifiés.
5. Vérifie les principales contraintes de couverture et signale celles qui manquent.
6. Affiche un rapport lisible avec un statut **PASS/FAIL** pour chaque contrôle.

Le validateur doit échouer sur un CSV volontairement corrompu. Ne confondez pas une donnée indisponible avec une valeur nulle (`0`).

### Étape 5 — Évaluer et améliorer (10 min)

Exécutez le validateur, corrigez le CSV si nécessaire et produisez une synthèse courte : cas couverts, cas manquants, modifications apportées après génération et limites de votre validation.

## 5. Livrables attendus

Déposez les quatre éléments suivants :

1. **`medimonitor_tp3_mesures.csv`** — données finales.
2. **`validate_tp3.py`** ou **`validate_tp3.ts`** — script de validation exécutable.
3. **`rapport_tp3.md`** — résultats des contrôles, couverture, défauts repérés et corrections.
4. **`prompts_tp3.md`** — prompts utilisés et brève explication de leur évolution.

## 6. Critères de réussite

| Critère | Points |
|---|---:|
| Couverture des partitions, seuils et transitions | 6 |
| Structure et cohérence du CSV | 4 |
| Qualité et exécution du validateur | 5 |
| Analyse critique des résultats de Copilot | 3 |
| Traçabilité et clarté des livrables | 2 |
| **Total** | **20** |

## 7. Questions de recul

- Pourquoi 1 000 valeurs générées aléatoirement peuvent-elles couvrir moins de cas que 88 valeurs choisies intentionnellement ?
- Quels tests sont impossibles à conclure si une règle métier est absente de la spécification ?
- Le validateur peut-il être incorrect alors que tous ses contrôles affichent PASS ? Comment le démontrer ?
- Quelle différence faites-vous entre une **mesure** et une **transition d'alarme** ?

**Rappel :** Copilot est un assistant de production. La responsabilité de la pertinence, de la conformité et de la validation des données reste celle du testeur.
