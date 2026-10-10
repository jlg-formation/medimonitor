# MediMonitor — TP2 — Corrigé formateur

**Version 1.0 · 10 octobre 2026 · Document C — Référence pédagogique**

> Ce corrigé est une **proposition de couverture de référence**, non une liste unique obligatoire. Il s’appuie sur la spécification TP2 (document A) et le prompt Copilot (document B). Les valeurs et seuils sont fictifs, propres au simulateur.

## 1. Méthode et conventions

- **État initial** : session neuve, huit patients P01 à P08, toutes composantes normales, sauf précondition explicite.
- **Injection automatique** : fixer une valeur au banc puis exécuter un tick ; les actions manuelles sont synchrones.
- **Isolation des sous-cas** : réinitialiser la session entre les valeurs d’un test de frontières pour éviter les alarmes résiduelles.
- **Pression artérielle** : toute saisie manuelle est un couple PAS/PAD avec PAS strictement supérieure à PAD ; pour une injection automatique, choisir une contrepartie physiologiquement cohérente si nécessaire.
- **Priorité P1** : tests portant sur les seuils, l’unicité et le cycle de vie des alarmes, les invariants d’override, les rejets et la traçabilité ; P2 : robustesse complémentaire.
- **Lecture des tests de frontières** : chaque flèche `valeur → catégorie` est une vérification indépendante. Les seuils ne doivent jamais être arrondis avant comparaison.

## 2. Inventaire des exigences

| Exigence | Comportement attendu |
|---|---|
| TP2-GEN-01 | Huit patients fixes, quatre constantes dont PAS/PAD |
| TP2-GEN-02 | Indépendance entre patients et composantes |
| TP2-CLS-01 | Classification exclusive par seuils |
| TP2-CLS-02 | Validation stricte des saisies et atomicité du rejet |
| TP2-CLS-03 | Sévérité globale = maximum des alarmes actives |
| TP2-ALM-01 | Création immédiate et unicité des alarmes actives |
| TP2-ALM-02 | Conservation sans doublon à priorité inchangée |
| TP2-ALM-03 | Changement de priorité et désacquittement |
| TP2-ALM-04 | Acquittement sans résolution |
| TP2-ALM-05 | Résolution, historique et nouvelle occurrence |
| TP2-MAN-01 | Saisie manuelle et reclassement immédiat |
| TP2-MAN-02 | Maintien de l’override malgré le scénario |
| TP2-MAN-03 | Libération vers la dernière valeur automatique |
| TP2-MAN-04 | Pause : horloge gelée, actions manuelles possibles |
| TP2-OBS-01 | Champs et visibilité des alarmes |
| TP2-OBS-02 | Journal chronologique, rejet sans événement métier |
| TP2-OBS-03 | Rechargement et remise à zéro de session |

**Total : 17 exigences.**

## 3. Catalogue de cas de test de référence

| ID test | Exigence(s) | Objectif | Préconditions | Étapes et données d’entrée | Résultat attendu | Technique | Priorité |
|---|---|---|---|---|---|---|---|
| TC-001 | TP2-GEN-01 | Population initiale | Session neuve | Ouvrir le tableau de bord | Exactement P01 à P08, identifiants stables, FC/SpO₂/température/PAS/PAD pour chacun | Structure | P1 |
| TC-002 | TP2-GEN-02 | Identifiants stables | Session ouverte | Faire évoluer P01 de plusieurs ticks | P01 à P08 inchangés | Séquence | P2 |
| TC-003 | TP2-GEN-02 | Isolation interpatients | P01 et P02 normaux | Imposer FC P01=121 ; observer P02 | P02 : aucune mesure, alarme ou override modifié | Isolation | P1 |
| TC-004 | TP2-GEN-02 | Isolation intercomposantes | P01 normal | Imposer FC=121 ; lire SpO₂ et température P01 | Autres composantes inchangées ; seule FC devient critique | Isolation | P2 |
| TC-005 | TP2-CLS-01 | Frontières FC | Session neuve ; chaque sous-cas réinitialisé | Injecter successivement FC : 49→CRITICAL ; 50→WARNING ; 59→WARNING ; 60→NORMAL ; 100→NORMAL ; 101→WARNING ; 120→WARNING ; 121→CRITICAL. Pour PAS/PAD, conserver FC=80 si compatible, sinon choisir une contrepartie normale respectant PAS>PAD. | Pour chaque valeur : catégorie indiquée ; une seule catégorie attribuée | Valeurs limites | P1 |
| TC-006 | TP2-CLS-01 | Frontières SpO₂ | Session neuve ; chaque sous-cas réinitialisé | Injecter successivement SpO₂ : 91→CRITICAL ; 92→WARNING ; 94→WARNING ; 95→NORMAL. Pour PAS/PAD, conserver SpO₂=97 si compatible, sinon choisir une contrepartie normale respectant PAS>PAD. | Pour chaque valeur : catégorie indiquée ; une seule catégorie attribuée | Valeurs limites | P1 |
| TC-007 | TP2-CLS-01 | Frontières Température | Session neuve ; chaque sous-cas réinitialisé | Injecter successivement Température : 34,9→CRITICAL ; 35,0→WARNING ; 35,9→WARNING ; 36,0→NORMAL ; 38,0→NORMAL ; 38,1→WARNING ; 39,0→WARNING ; 39,1→CRITICAL. Pour PAS/PAD, conserver température=37,0 si compatible, sinon choisir une contrepartie normale respectant PAS>PAD. | Pour chaque valeur : catégorie indiquée ; une seule catégorie attribuée | Valeurs limites | P1 |
| TC-008 | TP2-CLS-01 | Frontières PAS | Session neuve ; chaque sous-cas réinitialisé | Injecter successivement PAS : 89→CRITICAL ; 90→WARNING ; 99→WARNING ; 100→NORMAL ; 140→NORMAL ; 141→WARNING ; 160→WARNING ; 161→CRITICAL. Pour PAS/PAD, conserver PAD=70 si compatible, sinon choisir une contrepartie normale respectant PAS>PAD. | Pour chaque valeur : catégorie indiquée ; une seule catégorie attribuée | Valeurs limites | P1 |
| TC-009 | TP2-CLS-01 | Frontières PAD | Session neuve ; chaque sous-cas réinitialisé | Injecter successivement PAD : 59→CRITICAL ; 60→WARNING ; 64→WARNING ; 65→NORMAL ; 90→NORMAL ; 91→WARNING ; 100→WARNING ; 101→CRITICAL. Pour PAS/PAD, conserver PAS=130 si compatible, sinon choisir une contrepartie normale respectant PAS>PAD. | Pour chaque valeur : catégorie indiquée ; une seule catégorie attribuée | Valeurs limites | P1 |
| TC-010 | TP2-CLS-01 | PAS/PAD indépendantes | PAS=130, PAD=70 | Injecter PAS=161 et PAD=70 puis PAS=130 et PAD=101 | D’abord PAS CRITICAL/PAD NORMAL, puis PAS NORMAL/PAD CRITICAL | Partition | P1 |
| TC-011 | TP2-CLS-02 | Valeurs valides aux extrêmes | Session neuve | Saisir FC=0 puis 300 ; SpO₂=0 puis 100 ; température=20,0 puis 45,0 ; PAS/PAD=(300,0) | Chaque saisie acceptée ; valeurs visibles et classées selon seuils | Bornes de validité | P1 |
| TC-012 | TP2-CLS-02 | Hors domaine | Session neuve ; FC=80 | Essayer FC=-1 puis 301 ; SpO₂=-1 puis 101 ; température=19,9 puis 45,1 ; PAD=-1 puis 251 | Chaque saisie rejetée, mesure/override/alarmes inchangés ; motif affiché | Négatif / frontières | P1 |
| TC-013 | TP2-CLS-02 | Non numériques et non finis | FC=80 sans override | Saisir FC="abc", vide, NaN, +infini, 80,5 | Chaque saisie rejetée sans effet métier | Partitions invalides | P1 |
| TC-014 | TP2-CLS-02 | Précision de température | Température=37,0 | Saisir 37,05 puis 37,1 | 37,05 rejeté ; 37,1 accepté | Précision | P2 |
| TC-015 | TP2-CLS-02 | Cohérence PAS/PAD | PAS=120/PAD=80 | Saisir (120,120) puis (100,101) puis (120,80) | Deux premières rejetées intégralement ; troisième acceptée | Négatif / atomicité | P1 |
| TC-016 | TP2-CLS-02 | Rejet sans effet sur override | FC manuelle=121 et alarme active | Essayer FC=301 | FC reste 121 en Manuel ; alarme et priorité inchangées | Invariant | P1 |
| TC-017 | TP2-CLS-03 | Maximum de sévérité | P01 normal | FC=110 (WARNING), puis SpO₂=91 (CRITICAL), puis SpO₂=96 | Sévérité P01 : WARNING, CRITICAL, WARNING | Séquence | P1 |
| TC-018 | TP2-CLS-03 | Acquittement sans baisse de sévérité | FC P01=121, alarme active | Acquitter FC | Sévérité P01 demeure CRITICAL | Invariant | P1 |
| TC-019 | TP2-ALM-01 | Création à la frontière | FC P01=100, aucune alarme | Injecter FC=101 | Une alarme FC ACTIVE/NON ACQUITTÉE/WARNING, visible immédiatement | Transition | P1 |
| TC-020 | TP2-ALM-01 | Création critique directe | SpO₂ P01=95 | Injecter SpO₂=91 | Une alarme SpO₂ ACTIVE/NON ACQUITTÉE/CRITICAL | Transition | P1 |
| TC-021 | TP2-ALM-02 | Pas de doublon | FC P01=110, alarme WARNING active | Injecter 111 puis 115 puis 120 | Même identifiant, une seule alarme active FC | Séquence | P1 |
| TC-022 | TP2-ALM-03 | Aggravation | FC P01=110, alarme WARNING active | Noter ID/date création ; injecter FC=121 | Même ID/date, priorité CRITICAL, NON ACQUITTÉE | Transition | P1 |
| TC-023 | TP2-ALM-03 | Désescalade | FC P01=121, alarme CRITICAL active | Noter ID/date ; injecter FC=120 | Même ID/date, WARNING, NON ACQUITTÉE | Transition | P1 |
| TC-024 | TP2-ALM-03 | Acquittement réinitialisé | FC P01=110 ; alarme WARNING acquittée | Injecter FC=121 | Même alarme, CRITICAL, ACTIVE, NON ACQUITTÉE | Transition | P1 |
| TC-025 | TP2-ALM-04 | Acquittement simple | FC P01=121, alarme non acquittée | Acquitter | Alarme reste ACTIVE, visible, CRITICAL, marquée ACQUITTÉE | Transition | P1 |
| TC-026 | TP2-ALM-04 | Acquittement répété | FC P01=121, alarme déjà acquittée | Acquitter une seconde fois | Aucun changement d’état, priorité ou identifiant | Idempotence | P2 |
| TC-027 | TP2-ALM-05 | Résolution | FC P01=121, alarme active | Injecter FC=100 | Alarme RÉSOLUE, absente des actives, présente en historique avec date de résolution | Transition | P1 |
| TC-028 | TP2-ALM-05 | Nouvelle occurrence | FC P01=121, alarme active | Injecter FC=100 puis FC=121 | Première alarme résolue ; nouvelle alarme active avec nouvel ID | Cycle de vie | P1 |
| TC-029 | TP2-ALM-05 | Résolue non acquittable | Une alarme FC résolue | Tenter acquittement de son ID | L’alarme résolue ne devient pas acquittée ; aucun changement métier | Négatif | P2 |
| TC-030 | TP2-ALM-01, TP2-ALM-02 | Unicité par couple | FC P01=110 et FC P02=110 | Faire évoluer FC P01 et P02 sur 3 ticks | Une alarme active FC par patient ; identifiants distincts | Isolation | P1 |
| TC-031 | TP2-MAN-01 | Override immédiat | FC P01 automatique=80 | Imposer FC=121 | Affichage 121 + Manuel ; alarme CRITICAL créée immédiatement | Transition | P1 |
| TC-032 | TP2-MAN-01 | Override pression atomique | PAS/PAD P01=120/80 | Imposer PAS/PAD=161/70 | PAS et PAD en Manuel simultanément ; PAS CRITICAL, PAD NORMAL | Atomicité | P1 |
| TC-033 | TP2-MAN-02 | Override résiste aux ticks | FC P01 manuelle=121 | Injecter FC auto=80 puis 90, faire deux ticks | FC affichée=121, indicateur Manuel, alarme CRITICAL maintenue | Séquence | P1 |
| TC-034 | TP2-MAN-02 | Override résiste au scénario | FC P01 manuelle=121 | Changer de scénario puis injecter FC auto=80 | FC reste 121 en Manuel | Persistance session | P2 |
| TC-035 | TP2-MAN-03 | Libération vers valeur récente | FC manuelle=121 ; dernière FC auto=80 | Libérer FC | Manuel retiré, FC=80, alarme FC résolue immédiatement | Transition | P1 |
| TC-036 | TP2-MAN-03 | Libération de pression couplée | PAS/PAD manuelles=161/70 ; auto=120/80 | Libérer pression artérielle | PAS/PAD reviennent ensemble à 120/80 ; deux indicateurs Manuel retirés ; alarme PAS résolue | Atomicité | P1 |
| TC-037 | TP2-MAN-04 | Saisie pendant pause | Simulation en pause ; FC=80 | Imposer FC=121 | FC=121 en Manuel ; alarme CRITICAL immédiate ; horloge virtuelle inchangée | Pause / transition | P1 |
| TC-038 | TP2-MAN-04 | Libération pendant pause | Simulation en pause ; FC manuelle=121 ; dernière auto=80 | Libérer FC | FC=80, Manuel retiré, alarme résolue ; horloge virtuelle inchangée | Pause / transition | P1 |
| TC-039 | TP2-OBS-01 | Métadonnées d’alarme | FC P01=121 puis FC=80 | Inspecter fiche alarme avant/après résolution | ID unique, patient, FC, priorité, états, création virtuelle ; résolution virtuelle seulement après résolution | Observabilité | P1 |
| TC-040 | TP2-OBS-01 | Visibilité sans rechargement | FC P01=80 | Injecter 121 ; acquitter ; injecter 80 | Création, acquittement et résolution visibles immédiatement, sans reload | Interface | P1 |
| TC-041 | TP2-OBS-02 | Ordre des événements | Session neuve | Imposer FC=110 ; acquitter ; imposer FC=121 ; libérer | Journal chronologique avec actions, changement priorité, acquittement et résolution selon valeurs auto | Journal | P1 |
| TC-042 | TP2-OBS-02 | Rejet sans événement métier | FC=80, journal observé | Saisir FC=301 | Erreur motivée visible ; aucun nouvel événement métier ; état inchangé | Négatif | P1 |
| TC-043 | TP2-OBS-03 | Rechargement | P01 FC manuelle=121, alarme et journal présents | Recharger la page | Overrides, alarmes et journal vides ; huit patients P01–P08 présents | Réinitialisation | P1 |

## 4. Matrice de traçabilité

| Exigence | Tests associés | Couverture de référence | Justification / vigilance |
|---|---|---|---|
| TP2-GEN-01 | TC-001 | Complète (périmètre de référence) | Les comportements essentiels de cette exigence disposent de vérifications explicites ; vérifier les sous-cas en exécution. |
| TP2-GEN-02 | TC-002, TC-003, TC-004 | Complète (périmètre de référence) | Les comportements essentiels de cette exigence disposent de vérifications explicites ; vérifier les sous-cas en exécution. |
| TP2-CLS-01 | TC-005, TC-006, TC-007, TC-008, TC-009, TC-010 | Complète (périmètre de référence) | Les comportements essentiels de cette exigence disposent de vérifications explicites ; vérifier les sous-cas en exécution. |
| TP2-CLS-02 | TC-011, TC-012, TC-013, TC-014, TC-015, TC-016 | Partielle | Partielle : la liste couvre des classes représentatives, pas toutes les combinaisons de formats et domaines. |
| TP2-CLS-03 | TC-017, TC-018 | Complète (périmètre de référence) | Les comportements essentiels de cette exigence disposent de vérifications explicites ; vérifier les sous-cas en exécution. |
| TP2-ALM-01 | TC-019, TC-020, TC-030 | Complète (périmètre de référence) | Les comportements essentiels de cette exigence disposent de vérifications explicites ; vérifier les sous-cas en exécution. |
| TP2-ALM-02 | TC-021, TC-030 | Complète (périmètre de référence) | Les comportements essentiels de cette exigence disposent de vérifications explicites ; vérifier les sous-cas en exécution. |
| TP2-ALM-03 | TC-022, TC-023, TC-024 | Complète (périmètre de référence) | Les comportements essentiels de cette exigence disposent de vérifications explicites ; vérifier les sous-cas en exécution. |
| TP2-ALM-04 | TC-025, TC-026 | Complète (périmètre de référence) | Les comportements essentiels de cette exigence disposent de vérifications explicites ; vérifier les sous-cas en exécution. |
| TP2-ALM-05 | TC-027, TC-028, TC-029 | Complète (périmètre de référence) | Les comportements essentiels de cette exigence disposent de vérifications explicites ; vérifier les sous-cas en exécution. |
| TP2-MAN-01 | TC-031, TC-032 | Complète (périmètre de référence) | Les comportements essentiels de cette exigence disposent de vérifications explicites ; vérifier les sous-cas en exécution. |
| TP2-MAN-02 | TC-033, TC-034 | Complète (périmètre de référence) | Les comportements essentiels de cette exigence disposent de vérifications explicites ; vérifier les sous-cas en exécution. |
| TP2-MAN-03 | TC-035, TC-036 | Complète (périmètre de référence) | Les comportements essentiels de cette exigence disposent de vérifications explicites ; vérifier les sous-cas en exécution. |
| TP2-MAN-04 | TC-037, TC-038 | Complète (périmètre de référence) | Les comportements essentiels de cette exigence disposent de vérifications explicites ; vérifier les sous-cas en exécution. |
| TP2-OBS-01 | TC-039, TC-040 | Complète (périmètre de référence) | Les comportements essentiels de cette exigence disposent de vérifications explicites ; vérifier les sous-cas en exécution. |
| TP2-OBS-02 | TC-041, TC-042 | Partielle | Partielle : l’ordre est vérifié, mais pas l’exhaustivité de chaque type d’événement sur tous les parcours. |
| TP2-OBS-03 | TC-043 | Complète (périmètre de référence) | Les comportements essentiels de cette exigence disposent de vérifications explicites ; vérifier les sous-cas en exécution. |

## 5. Revue critique du catalogue

### Points d’attention pour le formateur

1. **Seuils** : les tests CLS-01 à CLS-05 contiennent plusieurs assertions chacun ; pour un référentiel industriel, les décomposer en tests atomiques par valeur et par composante.
2. **Pression artérielle** : éviter de tester PAS=89 avec PAD=90 dans une saisie manuelle : le couple serait rejeté pour incohérence, empêchant de vérifier la classification PAS. Utiliser le banc d’injection ou un couple valide.
3. **Sévérité et acquittement** : une alarme acquittée demeure active et contribue à la sévérité globale.
4. **Transitions** : lors d’un changement WARNING ↔ CRITICAL, conserver l’identifiant et la date de création mais réinitialiser l’acquittement.
5. **Réarmement** : un retour NORMAL résout l’alarme ; la prochaine anomalie crée une **nouvelle** occurrence.
6. **Overrides** : un scénario peut calculer de nouvelles valeurs sans les afficher ; la libération reprend la dernière valeur calculée, même pendant une pause si une telle valeur existe.
7. **Journal** : distinguer les événements métier des messages d’erreur de validation ; un rejet n’ajoute pas d’événement métier.

### Tests à compléter selon le temps disponible

- Vérifier explicitement les bornes **0/300** de PAS et **0/250** de PAD en conservant un couple valide ; tester PAS=301, PAD=251, valeurs décimales interdites et entrées non finies sur chaque champ.
- Décomposer les séquences de frontières en tests unitaires indépendants afin de mieux diagnostiquer les échecs.
- Vérifier le journal pour chaque type de transition (changement de priorité, résolution, acquittement et action manuelle) et les métadonnées exactes.
- Vérifier le comportement des alarmes sur **plusieurs composantes simultanées** d’un même patient et sur plusieurs patients.

### Clarifications possibles, sans invention de règle

- Le document ne fixe pas de format de date virtuelle ni de précision de l’horodatage ; vérifier la présence et la cohérence, sans imposer un format ISO arbitraire.
- Il ne décrit pas de règle métier sur la tentative d’acquittement d’une alarme déjà résolue au-delà de « ne peut plus être acquittée » ; ne pas inventer de code d’erreur HTTP ou de message exact.
- Il ne fixe pas d’ergonomie détaillée pour les erreurs ; exiger une raison explicite, sans imposer une formulation précise.
- La spécification ne définit pas de comportement de persistance des paramètres : ne pas ajouter de test sur ce point.

## 6. Synthèse chiffrée

| Indicateur | Résultat |
|---|---:|
| Exigences numérotées | 17 |
| Cas de test de référence | 43 |
| Exigences couvertes (au moins un test) | 17 |
| Couverture complète au niveau de référence | 15 |
| Couverture partielle / approfondissement souhaitable | 2 |
| Exigences sans test | 0 |

> La « couverture complète » est une appréciation pédagogique du périmètre fonctionnel essentiel, **pas une preuve d’exhaustivité combinatoire**.

### Les cinq tests à exécuter en premier

1. **TC-005** — frontières FC : détecte les erreurs de comparateurs inclusifs/exclusifs.
2. **TC-022** — aggravation d’une alarme : vérifie identité, priorité et date de création.
3. **TC-024** — désacquittement à changement de priorité : vérifie un invariant métier sensible.
4. **TC-033** — override qui résiste aux ticks : garantit le maintien de la valeur imposée.
5. **TC-035** — libération d’override : vérifie le retour automatique et la résolution associée.

## 7. Barème indicatif (/20)

| Critère | Points |
|---|---:|
| Exactitude des cas et résultats attendus | 7 |
| Valeurs limites, partitions et transitions | 5 |
| Traçabilité et couverture des 17 exigences | 4 |
| Revue critique des résultats Copilot | 3 |
| Lisibilité et reproductibilité | 1 |

**Consigne d’évaluation** : valoriser un catalogue plus court mais exact et justifié plutôt qu’un grand nombre de tests redondants ou inventés.
