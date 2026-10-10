# MediMonitor — Synthèse des 10 travaux pratiques

**Public :** analystes fonctionnels et testeurs logiciels  
**Contexte :** simulateur pédagogique de surveillance de huit patients fictifs  
**Outils possibles :** Microsoft Copilot, GitHub Copilot dans VS Code, TypeScript, Vitest et Playwright  
**Principe :** données entièrement fictives ; aucune connexion à un dispositif médical réel.

## Objectifs pédagogiques

Utiliser l'IA comme assistant d'analyse et de test, tout en vérifiant systématiquement ses propositions. Les exercices s'appuient sur un même projet, **MediMonitor**, qui simule des constantes vitales, des scénarios d'évolution, des interventions manuelles et des alarmes.

## Les 10 TP

| TP | Sujet | Travail demandé | Livrable attendu |
|---|---|---|---|
| **1** | **Revue critique des exigences** | Examiner une spécification volontairement ambiguë ou contradictoire ; identifier les défauts, poser les questions au Product Owner et reformuler les exigences avec Copilot. | Registre d'anomalies documentaires, questions ouvertes et exigences corrigées. |
| **2** | **Conception de cas de test** | Transformer les exigences validées en scénarios nominaux, limites et erreurs ; vérifier la couverture des règles métier. | Catalogue de tests avec préconditions, étapes, données et résultats attendus. |
| **3** | **Génération de données synthétiques** | Construire des jeux de mesures fictives : valeurs normales, seuils, valeurs invalides, perte de capteur et évolutions temporelles. | Jeux de données reproductibles et justification des partitions d'équivalence. |
| **4** | **Premiers tests unitaires automatisés** | Écrire puis faire générer et relire des tests Vitest pour la classification des seuils (`classifyValue`) ; mesurer leur efficacité par la couverture et par des sabotages volontaires. | Suite de tests automatisés, rapport de couverture et de sabotages. |
| **5** | **Diagnostic d'anomalies logicielles** | Analyser un défaut introduit dans une branche dédiée, reproduire le comportement et rechercher la cause racine avec GitHub Copilot. | Fiche de bug, test de non-régression et proposition de correction. |
| **6** | **Traçabilité exigences–tests** | Relier exigences, règles métier, scénarios et tests ; repérer les exigences non couvertes ou les tests sans justification. | Matrice de traçabilité et analyse des lacunes. |
| **7** | **Analyse des risques** | Identifier les défaillances possibles du simulateur (alarme non affichée, priorité erronée, mesure périmée, etc.) et prioriser les vérifications. | Registre de risques, mesures de maîtrise et tests associés. |
| **8** | **Tests d'API simulée** | Définir un contrat REST fictif pour les patients, mesures et alarmes ; produire des tests sur des réponses simulées, sans backend réel. | Contrat d'API, mocks et tests de contrat/validation. |
| **9** | **Analyse de journaux** | Étudier des journaux synthétiques d'événements, détecter des incohérences chronologiques et reconstruire une séquence d'incident. | Chronologie d'incident, hypothèses et éléments de preuve. |
| **10** | **Tests de bout en bout** | Automatiser des parcours utilisateur dans le navigateur avec Playwright : sélection d'un patient, lancement d'un scénario, acquittement et résolution d'une alarme. | Scénarios E2E exécutables, résultats et captures en cas d'échec. |

## Progression proposée

- **TP 1 à 3 — Analyser et préparer :** clarifier les exigences, concevoir les tests et préparer les données.
- **TP 4 à 6 — Vérifier et diagnostiquer :** automatiser, investiguer et mesurer la traçabilité.
- **TP 7 à 10 — Élargir la validation :** raisonner par les risques, tester les interfaces simulées, analyser les traces et valider les parcours complets.

## Règles communes aux exercices

1. **L'IA propose, le stagiaire valide.** Toute conclusion doit être confrontée à une exigence, une observation ou un résultat de test.
2. **Aucune hypothèse silencieuse.** Les décisions métier non documentées sont signalées comme questions à arbitrer.
3. **Reproductibilité.** Les jeux de données, graines de simulation, versions et étapes de reproduction sont conservés.
4. **Séparation des supports.** La version de référence de MediMonitor reste correcte ; les défauts volontaires sont introduits dans des supports ou branches de TP distincts.
5. **Périmètre pédagogique.** MediMonitor ne constitue ni un dispositif médical ni un outil de décision clinique.

## Évaluation transversale

Pour chaque TP, évaluer la **pertinence de l'analyse**, la **qualité des preuves**, la **testabilité des propositions**, la **traçabilité** et l'**esprit critique vis-à-vis des réponses de Copilot**.
