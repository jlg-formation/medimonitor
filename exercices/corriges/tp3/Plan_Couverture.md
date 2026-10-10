# MediMonitor — TP3 — Corrigé formateur
## Étape 1 : plan de couverture des données de test

**Référence :** TP3 document A, étape 1, et spécification TP2 v1.0  
**Durée indicative :** 10 minutes  
**Statut :** proposition de référence, non liste exhaustive

### 1. Objectif et stratégie

Construire **avant toute génération** un jeu de données couvrant les classes d'équivalence, les frontières, l'indisponibilité et les transitions temporelles. Les 88 lignes prévues (8 patients × 11 instants, minutes 0 à 10 incluses) doivent être **choisies intentionnellement** : le hasard seul ne garantit pas la couverture.

Une ligne CSV contient cinq composantes (FC, SpO₂, température, PAS, PAD). Une même ligne peut donc couvrir plusieurs frontières, mais les trajectoires temporelles doivent rester lisibles.

### 2. Partitions d'équivalence et valeurs limites

Les valeurs ci-dessous sont celles du simulateur fictif. Elles ne constituent **pas** des seuils cliniques.

| Composante | NORMAL | WARNING | CRITICAL | Frontières prioritaires à échantillonner |
|---|---|---|---|---|
| FC (bpm) | 60–100 | 50–59 ; 101–120 | ≤49 ; ≥121 | **49, 50, 59, 60, 100, 101, 120, 121** |
| SpO₂ (%) | ≥95 | 92–94 | ≤91 | **91, 92, 94, 95** |
| Température (°C) | 36,0–38,0 | 35,0–35,9 ; 38,1–39,0 | ≤34,9 ; ≥39,1 | **34,9 ; 35,0 ; 35,9 ; 36,0 ; 38,0 ; 38,1 ; 39,0 ; 39,1** |
| PAS (mmHg) | 100–140 | 90–99 ; 141–160 | ≤89 ; ≥161 | **89, 90, 99, 100, 140, 141, 160, 161** |
| PAD (mmHg) | 65–90 | 60–64 ; 91–100 | ≤59 ; ≥101 | **59, 60, 64, 65, 90, 91, 100, 101** |

**À couvrir pour chaque composante :** une valeur NORMAL, au moins une WARNING, au moins une CRITICAL, et les frontières pertinentes. Pour les mesures avec seuil bas et seuil haut (FC, température, PAS, PAD), tester **les deux côtés** lorsque le volume le permet.

**Attention à la pression artérielle :** le TP2 impose `PAS > PAD` lors d'une **saisie manuelle**. Le CSV du TP3 représente des mesures synthétiques, pas nécessairement des saisies manuelles ; pour garder des données cohérentes et réutilisables, appliquer néanmoins `PAS > PAD` aux couples disponibles. Tester la règle de rejet d'une saisie manuelle relève plutôt du TP2.

### 3. Indisponibilité et validité

| Classe | Exemple dans le CSV | Résultat / contrôle attendu |
|---|---|---|
| Disponible et NORMAL | `spo2=98` | Classe NORMAL |
| Disponible et WARNING | `spo2=94` | Classe WARNING |
| Disponible et CRITICAL | `spo2=91` | Classe CRITICAL |
| Indisponible | champ `spo2` vide | État **INDISPONIBLE**, jamais NORMAL |
| Zéro numérique | `spo2=0` | Valeur présente, **non** assimilée à un champ vide ; classification CRITICAL selon le seuil, si valide |
| Format invalide | `spo2=abc` | **FAIL** au contrôle du format |
| Hors domaine | `spo2=105` | **FAIL** au contrôle du domaine de validité, et non NORMAL |

Les domaines explicites de validité du TP2 concernent les **saisies manuelles** : FC 0–300, SpO₂ 0–100, température 20,0–45,0, PAS 0–300, PAD 0–250. Leur application stricte aux **mesures automatiques importées** n'est pas spécifiée dans le TP2 : c'est un **arbitrage à signaler**, même si le jeu de données de référence reste volontairement dans ces bornes.

### 4. Couverture des transitions dans le temps

| ID | Séquence recherchée | Exemple SpO₂ | Résultat attendu |
|---|---|---|---|
| TR-01 | NORMAL stable | 98 → 97 → 98 | Pas de nouvelle alarme |
| TR-02 | NORMAL → WARNING | 95 → 94 | Début d'anomalie WARNING |
| TR-03 | WARNING stable | 94 → 92 | Pas de nouvelle occurrence pour la même composante |
| TR-04 | WARNING → CRITICAL | 92 → 91 | Aggravation / priorité CRITICAL |
| TR-05 | CRITICAL stable | 91 → 90 | Pas de doublon |
| TR-06 | CRITICAL → WARNING | 91 → 92 | Amélioration, anomalie encore active |
| TR-07 | WARNING → NORMAL | 94 → 95 | Résolution de l'anomalie |
| TR-08 | CRITICAL → NORMAL | 91 → 95 | Résolution directe |
| TR-09 | NORMAL → anomalie après résolution | 94 → 95 → 94 | Nouvelle occurrence d'anomalie |
| TR-10 | Disponible → indisponible → disponible | 96 → vide → 93 | Détecter l'absence et le retour de mesure |

**Limite importante :** le CSV permet de couvrir les **stimuli** et leurs catégories. Il ne démontre pas à lui seul qu'une alarme a été créée, acquittée, conservée ou résolue : il faut exécuter le moteur d'alarmes et observer ses sorties. Le comportement d'une alarme déjà active quand la mesure devient indisponible n'est pas défini dans le TP2, qui exclut les valeurs indisponibles de son moteur d'alarmes. **Ne pas inventer de résultat attendu** pour ce cas.

### 5. Répartition conseillée des huit patients

| Patient (CSV TP3) | Scénario dominant | Couverture visée |
|---|---|---|
| P-001 | Patient stable | NORMAL aux 11 instants, référence négative |
| P-002 | Désaturation puis récupération | SpO₂ 95/94 et 92/91, TR-02 à TR-07 |
| P-003 | Fréquence cardiaque haute | FC 100/101 et 120/121, aggravation et récupération |
| P-004 | Fréquence cardiaque basse | FC 60/59 et 50/49, branche basse |
| P-005 | Température variable | 35,9/36,0 ; 38,0/38,1 ; 39,0/39,1 |
| P-006 | Pression artérielle haute | PAS 140/141 et 160/161 ; PAD 90/91 et 100/101 |
| P-007 | Pression artérielle basse | PAS 100/99 et 90/89 ; PAD 65/64 et 60/59 |
| P-008 | Perte puis retour d'une mesure | Champ vide, reprise ; cas de nouvelle anomalie après retour à NORMAL |

Cette affectation est **une stratégie de construction**, pas une obligation fonctionnelle. Des scénarios peuvent être combinés, à condition que chaque trajectoire reste vérifiable.

**Point de vigilance sur les identifiants :** la spécification TP2 utilise `P01` à `P08`, tandis que l'énoncé TP3 impose `P-001` à `P-008`. Pour le **CSV TP3**, utiliser les identifiants de l'énoncé (`P-001`…`P-008`) et **documenter cette divergence** ; ne pas prétendre que les deux formats sont identiques.

### 6. Matrice de couverture minimale

| ID | Obligation | Preuve attendue dans les données |
|---|---|---|
| CV-01 | Huit patients distincts | P-001 à P-008 présents |
| CV-02 | Onze mesures par patient | Instants 10:00 à 10:10 UTC, sans lacune |
| CV-03 | 88 lignes, aucun doublon | Couples (`patientId`, `timestamp`) uniques |
| CV-04 | NORMAL stable | Un patient NORMAL à chaque instant |
| CV-05 | Trois classes de sévérité | NORMAL, WARNING, CRITICAL représentés |
| CV-06 | Frontières SpO₂ | 91, 92, 94, 95 présentes |
| CV-07 | Frontières FC | 49/50, 59/60, 100/101, 120/121 présentes |
| CV-08 | Température anormale | WARNING et CRITICAL, avec frontières |
| CV-09 | PAS anormale | WARNING et CRITICAL, avec frontières |
| CV-10 | PAD testée selon TP2 | Au moins NORMAL, WARNING et CRITICAL |
| CV-11 | Dégradation et récupération | NORMAL → WARNING → CRITICAL → WARNING → NORMAL |
| CV-12 | Indisponibilité | Au moins un champ vide sans suppression de ligne |
| CV-13 | Retour après indisponibilité | Valeur disponible à un instant ultérieur |
| CV-14 | Cohérence des formats | ISO 8601 UTC, décimales à point, entiers attendus |
| CV-15 | Cohérence pression artérielle | PAS > PAD quand les deux valeurs sont présentes |

**Priorité si le temps manque :** CV-01 à CV-09 et CV-11 à CV-14 sont indispensables pour satisfaire l'énoncé. CV-10 et CV-15 renforcent la cohérence avec le TP2.

### 7. Points à clarifier / non déductibles

1. **Comportement des alarmes sur indisponibilité :** non spécifié par le TP2 ; ne pas supposer résolution ou maintien.
2. **Seuils PAD :** ils sont bien **définis dans le TP2** (contrairement à l'ancienne spécification défectueuse du TP1) ; il faut les reprendre, pas les inventer.
3. **Identifiants patients :** formats différents entre TP2 et TP3 ; appliquer la convention CSV du TP3.
4. **Validité des mesures automatiques :** les bornes de saisie manuelle ne suffisent pas à définir toutes les règles d'import.
5. **Plausibilité physiologique et corrélations entre constantes :** aucune règle quantitative fournie ; ne pas inventer de contrainte médicale.
6. **Horodatage d'une alarme :** l'instant de mesure est présent, mais le CSV ne contient ni événement d'acquittement ni identifiant d'alarme ; ces états ne sont pas testables sur le CSV seul.

### 8. Critères de correction de l'étape 1

Un plan de couverture est satisfaisant s'il :

- distingue **classes d'équivalence** et **frontières exactes** ;
- couvre les deux branches des seuils quand elles existent ;
- prévoit des **séquences temporelles**, pas seulement des valeurs isolées ;
- traite le **vide différemment de zéro** ;
- explicite les **limites de ce qui est déductible** de la spécification ;
- prévoit une affectation réalisable dans **88 lignes** ;
- évite de confondre **couverture des données d'entrée** et **preuve du comportement des alarmes**.

**Conclusion formateur :** un bon plan de couverture est une liste argumentée de cas à produire et à contrôler. Il ne dépend pas du volume de données générées, mais de la capacité de chaque donnée à éprouver une règle ou une transition précise.
