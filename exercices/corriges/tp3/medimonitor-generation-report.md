# MediMonitor — TP3 — Rapport de génération du jeu de données

**Document :** rapport de référence du formateur, étape 2 du TP3  
**Fichier analysé :** `medimonitor-test-data-corrige.csv`  
**Sources de conception :** spécification fonctionnelle TP2 et plan de couverture TP3 (étape 1)  
**Nature :** données entièrement synthétiques, réservées aux exercices de test logiciel.

## 1. Résumé de la génération

Le jeu de données a été construit **de manière déterministe**, en attribuant un scénario principal à chacun des huit patients fictifs. Les valeurs ont été choisies pour traverser des frontières de classification et produire des trajectoires temporelles explicites ; elles ne proviennent pas d'un tirage aléatoire ni d'observations cliniques.

Le CSV comporte sept colonnes, dans cet ordre :

```csv
patientId,timestamp,heartRate,spo2,temperature,systolic,diastolic
```

Les huit patients `P-001` à `P-008` disposent chacun de onze instants de mesure, espacés d'une minute, du `2026-10-10T10:00:00Z` au `2026-10-10T10:10:00Z`. Les lignes sont ordonnées par patient puis par horodatage.

**Bilan du fichier effectivement inspecté :**

| Indicateur | Résultat |
|---|---:|
| Lignes de données (hors en-tête) | 88 |
| Colonnes | 7 |
| Patients distincts | 8 |
| Instants par patient | 11 |
| Couples `(patientId, timestamp)` distincts | 88 |
| Mesures absentes | 1 (SpO₂ de P-008 à 10:02) |

## 2. Méthode de construction

1. **Reprendre les seuils** de la spécification fonctionnelle et les classes d'équivalence du plan de couverture.
2. **Choisir une trajectoire par patient**, de façon à couvrir simultanément plusieurs frontières dans onze instants.
3. **Maintenir les autres constantes à des valeurs de référence** lorsque la trajectoire porte sur une seule composante. Cela facilite l'interprétation.
4. **Insérer explicitement les valeurs frontières** plutôt que compter sur le hasard.
5. **Prévoir des phases de retour à la normale**, pour rendre testables les transitions de résolution et de réapparition.
6. **Représenter une mesure indisponible par une cellule vide**, distincte de la valeur numérique zéro.
7. **Contrôler la structure et les valeurs du fichier produit**, puis signaler ce qui n'est pas vérifiable à partir du CSV seul.

Cette méthode privilégie la **couverture fonctionnelle** et la reproductibilité plutôt que le réalisme physiologique d'une série clinique.

## 3. Scénarios effectivement présents

| Patient | Mesure principale | Construction et points remarquables |
|---|---|---|
| P-001 | Toutes | Valeurs stables et normales pendant les onze minutes |
| P-002 | SpO₂ | 98 → 95 → 94 → 92 → 91 → 90 → 92 → 94 → 95 → 98 : dégradation puis récupération |
| P-003 | Fréquence cardiaque | Franchissement haut : 100 → 101, puis 120 → 121, puis retour à 100 |
| P-004 | Fréquence cardiaque | Franchissement bas : 60 → 59, puis 50 → 49, puis retour à 60 |
| P-005 | Température | Frontières basses 36,0/35,9 et 35,0/34,9 ; hautes 38,0/38,1 et 39,0/39,1 |
| P-006 | PAS et PAD | Pression haute : PAS 140/141 et 160/161 ; PAD 90/91 et 100/101 |
| P-007 | PAS et PAD | Pression basse : PAS 100/99 et 90/89 ; PAD 65/64 et 60/59 |
| P-008 | SpO₂ et FC | SpO₂ vide à 10:02 puis disponible à 10:03 ; retour NORMAL puis nouvelle WARNING à 10:06 ; FC = 121 à 10:04 |

La trajectoire de P-008 permet de distinguer une **interruption de mesure** d'une **valeur numérique anormale**.

## 4. Couverture des classes et des frontières

| Composante | Frontières prévues | Présence dans le CSV |
|---|---|---|
| Fréquence cardiaque | 49, 50, 59, 60, 100, 101, 120, 121 | Toutes présentes |
| SpO₂ | 91, 92, 94, 95 | Toutes présentes |
| Température | 34,9 ; 35,0 ; 35,9 ; 36,0 ; 38,0 ; 38,1 ; 39,0 ; 39,1 | Toutes présentes |
| Pression systolique | 89, 90, 99, 100, 140, 141, 160, 161 | Toutes présentes |
| Pression diastolique | 59, 60, 64, 65, 90, 91, 100, 101 | Toutes présentes |

Pour chaque composante, le fichier contient des valeurs représentatives des classes **NORMAL**, **WARNING** et **CRITICAL**, conformément aux seuils retenus pour le TP.

## 5. Bilan des critères du plan de couverture

| Critère | État | Justification |
|---|---|---|
| CV-01 — Huit patients | Satisfait | P-001 à P-008 |
| CV-02 — Onze instants par patient | Satisfait | Onze minutes horodatées par patient |
| CV-03 — 88 lignes sans doublon | Satisfait | 88 couples patient/horodatage distincts |
| CV-04 — NORMAL stable | Satisfait | P-001 |
| CV-05 — Trois classes de sévérité | Satisfait | Valeurs normales, WARNING et CRITICAL |
| CV-06 — Frontières SpO₂ | Satisfait | 91, 92, 94, 95 |
| CV-07 — Frontières FC | Satisfait | Huit valeurs frontières |
| CV-08 — Température | Satisfait | Frontières basses et hautes |
| CV-09 — PAS | Satisfait | Frontières basses et hautes |
| CV-10 — PAD | Satisfait | Frontières basses et hautes |
| CV-11 — Dégradation/récupération | Satisfait | P-002 |
| CV-12 — Mesure indisponible | Satisfait | SpO₂ vide, P-008 à 10:02 |
| CV-13 — Retour de disponibilité | Satisfait | SpO₂ renseignée à 10:03 |
| CV-14 — Formats cohérents | Satisfait | En-tête, dates UTC, nombres, décimales à point |
| CV-15 — PAS > PAD | Satisfait | Couples renseignés cohérents |

**Bilan : 15 critères sur 15 représentés dans le jeu de données.** Ce résultat mesure la présence des données nécessaires ; il ne prouve pas que l'application les traite correctement.

## 6. Contrôles du fichier et limites

Les vérifications de structure, de chronologie, d'unicité, de présence des frontières et de cohérence des pressions ont été effectuées sur le CSV de référence. Aucun doublon de couple `(patientId, timestamp)` n'a été relevé.

Les éléments suivants **ne sont pas démontrables avec le CSV seul** :

- la création effective des alarmes par MediMonitor ;
- l'acquittement, le maintien visible ou la résolution d'une alarme ;
- les temps de réaction de l'interface ;
- le comportement d'une alarme déjà active lorsqu'une mesure devient indisponible ;
- la plausibilité clinique des évolutions.

Les identifiants du CSV suivent la convention **TP3** (`P-001` à `P-008`). Si la spécification TP2 ou l'application utilisent `P01` à `P08`, une règle de correspondance doit être décidée avant import.

## 7. Conclusion

Le fichier `medimonitor-test-data-corrige.csv` est un **jeu de référence pour la formation** : il contient exactement 88 lignes et matérialise les quinze objectifs du plan de couverture. Sa génération repose sur une sélection volontaire de valeurs et de séquences, plutôt que sur des mesures aléatoires.

**Étape suivante du TP3 :** faire vérifier ce CSV par un script indépendant (Python ou TypeScript), afin que les stagiaires confrontent les déclarations de Copilot à des contrôles exécutables.
