# MediMonitor — TP4 — Corrigé formateur

**Version 1.0 · 10 octobre 2026 · Document C — Référence pédagogique**

> Ce corrigé propose une **suite de référence** parmi d'autres possibles. Il s'appuie sur l'énoncé (document A, [`sujets/tp4/README.md`](../../sujets/tp4/README.md)), le prompt Copilot (document B) et la spécification §8. Les seuils sont fictifs, propres au simulateur.

## 1. Contenu du corrigé

| Fichier | Rôle |
|---|---|
| [`classifyValue.test.ts`](classifyValue.test.ts) | Suite de référence : 51 cas de frontières, 3 tests sur le paramètre `thresholds`, 2 tests de contrat, 1 `it.todo` |
| [`conditionFor.test.ts`](conditionFor.test.ts) | Extension « pour aller plus loin » (THR-001) |
| [`catalogue.ts`](catalogue.ts), [`mutants.ts`](mutants.ts) | 10 versions sabotées de `classifyValue` (M1 à M10) |
| [`mutant-thresholds.ts`](mutant-thresholds.ts), [`vitest.mutation.config.ts`](vitest.mutation.config.ts) | Substitution du module `thresholds` par un mutant, **sans modifier `src/`** |
| [`run-mutants.ts`](run-mutants.ts) | Campagne de mutants avec score, applicable à n'importe quelle suite |
| [`vitest.config.ts`](vitest.config.ts) | Exécution isolée du corrigé |

| Commande | Effet |
|---|---|
| `npm run test:tp4:corrige` | Exécute le corrigé : 59 tests verts, 1 todo |
| `npm run test:tp4:mutants` | Score de mutation de la suite du stagiaire (`tests/tp4`) |
| `npm run test:tp4:mutants -- <dossier>` | Score de mutation d'une autre suite (ex. `exercices/corriges/tp4`) |

## 2. Déroulé conseillé pour le formateur

**Avant la séance :** `npm install`, puis vérifier `npm run test:tp4` sur un poste stagiaire (2 tests verts après copie du fichier de départ). Prévoir GitHub Copilot Chat activé.

| Étape | Durée | Point d'attention |
|---|---:|---|
| 1. Lire le code et le premier test | 10 min | Faire **lire** un message d'échec Vitest (`expected … to deeply equal …`) : c'est souvent une première pour des analystes. |
| 2. Concevoir les cas FC à la main | 15 min | Exiger le tableau **avant** tout recours à Copilot. Vérifier les paires 49/50, 59/60, 100/101, 120/121. |
| 3. Écrire les premiers tests | 15 min | Passer de 3 `it` séparés à un `it.each` : montrer que le rapport affiche un test par ligne. |
| 4. Étendre avec Copilot | 20 min | Circuler et repérer les pièges du §5. Interdire le mode *Agent*. |
| 5. Couverture et sabotages | 15 min | Point clé du TP : 100 % de lignes couvertes ne garantit pas une suite efficace. Vérifier le `git restore`. |
| 6. Synthèse | 15 min | Lancer `npm run test:tp4:mutants` sur quelques suites et commenter les scores en groupe. |

## 3. Analyse de la fonction testée

```ts
export function classifyValue(key: VitalKey, value: number, thresholds: Thresholds): Condition | null {
  const t = thresholds[key];
  if (value < t.criticalLow) return { cause: 'LOW', severity: 'CRITICAL' };
  if (value < t.warningLow) return { cause: 'LOW', severity: 'WARNING' };
  if (t.criticalHigh !== null && value > t.criticalHigh) return { cause: 'HIGH', severity: 'CRITICAL' };
  if (t.warningHigh !== null && value > t.warningHigh) return { cause: 'HIGH', severity: 'WARNING' };
  return null;
}
```

Points que les stagiaires doivent dégager à l'étape 1 :

- **Fonction pure** : pas d'horloge, pas d'état, pas d'effet de bord. C'est la cible idéale d'un premier test unitaire.
- **NORMAL est représenté par `null`**, et non par une chaîne `'NORMAL'`. Le test doit donc utiliser `toBeNull()`. `toBeFalsy()` accepterait aussi `undefined`, `0` ou `''` (mutant M10).
- **Bornes** : comparaisons strictes (`<`, `>`). La valeur égale à un seuil appartient à la classe la moins grave : 50 bpm donne WARNING et non CRITICAL ; 100 bpm donne NORMAL. Cela correspond exactement au §8.
- **Ordre des tests** : la condition critique est évaluée avant l'alerte. Si on l'inverse, 40 bpm devient WARNING (mutant M5).
- **Seuils hauts `null`** (SpO₂) : ils sont neutralisés par la garde `!== null`. Sans cette garde, `value > null` vaut `value > 0` en JavaScript, et toute SpO₂ deviendrait CRITICAL (mutant M8).
- **Précondition** : la valeur est supposée **déjà validée**. `NaN`, `Infinity` et les valeurs hors domaine sont filtrés en amont par `validateVital`, puis `conditionFor` ne transmet que des mesures `VALID` (THR-001).

## 4. Cas de référence

### 4.1 Partitions et frontières (seuils par défaut)

Légende : **C↓** = `{ LOW, CRITICAL }` · **W↓** = `{ LOW, WARNING }` · **N** = `null` · **W↑** = `{ HIGH, WARNING }` · **C↑** = `{ HIGH, CRITICAL }`. Les valeurs **en gras** sont des frontières.

| Composante | C↓ | W↓ | N | W↑ | C↑ |
|---|---|---|---|---|---|
| FC (bpm) | 30, **49** | **50**, **59** | **60**, 75, **100** | **101**, **120** | **121**, 180 |
| SpO₂ (%) | 85, **91** | **92**, **94** | **95**, 98, **100** | — | — |
| Température (°C) | 33, **34,9** | **35**, **35,9** | **36**, 37, **38** | **38,1**, **39** | **39,1**, 41 |
| PAS (mmHg) | 70, **89** | **90**, **99** | **100**, 120, **140** | **141**, **160** | **161**, 200 |
| PAD (mmHg) | 40, **59** | **60**, **64** | **65**, 80, **90** | **91**, **100** | **101**, 120 |

Soit **51 cas**, dont 37 frontières. AC-03 est couvert par 100, 120 et 121 bpm.

**Minimum acceptable pour un stagiaire :** les frontières de chaque composante, avec les deux côtés de chaque borne. Les valeurs représentatives au milieu des classes (75, 37…) sont redondantes avec les frontières pour une fonction de cette forme ; leur intérêt est surtout la lisibilité. Accepter une suite qui les omet, si le stagiaire le justifie.

**SpO₂ 100 :** c'est le maximum du domaine de validité ; le cas vérifie l'absence de seuil haut. **Température :** les frontières se testent au dixième, car `validateVital` arrondit la température au dixième (Annexe A). Tester 35,99 n'est pas faux, mais ne correspond à aucune valeur réellement transmise par l'application.

### 4.2 Au-delà des frontières

| Test | Ce qu'il prouve | Mutant détecté |
|---|---|---|
| Seuils FC personnalisés `{80, 90, 110, 130}` : 75 → C↓, 85 → W↓, 125 → W↑ | La fonction utilise son paramètre `thresholds` | M7 |
| FC avec `warningHigh` et `criticalHigh` à `null` : 250 → `null` | Un seuil haut absent ne déclenche rien, quelle que soit la composante | M8 |
| `Object.freeze` sur les seuils reçus | La fonction ne modifie pas ses entrées | — (robustesse) |
| Clés du résultat = `['cause', 'severity']` | Pas de champ parasite dans l'objet | — (contrat) |
| `it.todo` sur `NaN` / `Infinity` | Comportement non spécifié, à arbitrer (question Q1) | — |

## 5. Pièges fréquents dans les tests générés par Copilot

| # | Piège observé | Pourquoi c'est un problème | Correction attendue |
|---|---|---|---|
| P1 | Résultat attendu **calculé avec la même logique que le code** (ex. `const expected = value < t.criticalLow ? … : …`) | Le test réplique le code : il ne peut détecter aucune erreur d'interprétation des bornes | Écrire des valeurs attendues **littérales**, issues du §8 |
| P2 | Assertion sur la seule sévérité (`?.severity`), ou helper `?? 'NORMAL'` | La cause LOW/HIGH n'est jamais vérifiée (M6), `undefined` devient NORMAL (M10) | `toEqual` sur l'objet complet, `toBeNull()` |
| P3 | Uniquement `DEFAULT_THRESHOLDS` | Une fonction qui ignore son paramètre passe tous les tests (M7) | Un test avec seuils personnalisés |
| P4 | Température testée avec des entiers seulement (35, 36, 39, 40) | Un arrondi parasite passe inaperçu (M9) | Frontières au dixième : 34,9 / 35 / 35,9 / 36 / 38 / 38,1 / 39 / 39,1 |
| P5 | Seuil haut SpO₂ inventé (ex. « > 100 → WARNING ») | Règle absente du §8 : hypothèse silencieuse | Supprimer, noter l'hypothèse ; tester 98 et 100 → `null` |
| P6 | Une seule valeur par frontière (50 sans 49, ou 120 sans 121) | Le décalage d'une borne (`<` / `<=`) n'est détecté que d'un côté | Tester les deux côtés de chaque borne |
| P7 | Copilot propose de **modifier `classifyValue`** ou de changer le résultat attendu quand un test échoue | Le test s'aligne sur le code au lieu de la spécification | Relire le §8 ; signaler l'écart sans retoucher le code |
| P8 | Mutation de `DEFAULT_THRESHOLDS` dans un test (`DEFAULT_THRESHOLDS.heartRate.criticalLow = 80`) | Pollue les tests suivants : résultats dépendant de l'ordre d'exécution | `structuredClone(DEFAULT_THRESHOLDS)` |
| P9 | Valeurs hors domaine (FC 500, SpO₂ 150) avec un résultat « attendu » | Hors du contrat de la fonction : le résultat n'est pas spécifié | Retirer, ou signaler comme question |
| P10 | Import depuis `tests/unit` ou recopie des tests existants (via `@workspace`) | Contourne l'objectif du TP | Contexte limité aux trois `#file:` du prompt |

**Ambiguïté à valoriser :** l'énoncé du TP3 exprime les seuils de température en plages discrètes (« 35,0 à 35,9 »), alors que le §8 utilise des intervalles continus (« 35 ≤ x < 36 »). Un stagiaire qui relève cette différence et choisit explicitement le §8 comme référence fait preuve de l'esprit critique attendu.

## 6. Couverture de code : résultats attendus

Avec `npm run test:tp4:coverage`, le périmètre mesuré est `src/domain/thresholds.ts` entier (`classifyValue`, `conditionFor`, `validateThresholds`).

| Suite | Lignes `thresholds.ts` | Lignes de `classifyValue` | Score de mutation |
|---|---:|---|---:|
| Fichier de départ (2 tests) | — | partielle (branches LOW et W↑ non exécutées) | **1/10** |
| FC seule, 8 frontières, assertion sur la sévérité seule | 20,6 % | **100 %** | **5/10** |
| Corrigé (`classifyValue` + `conditionFor`) | 29,4 % | 100 % | **10/10** |
| Suite existante du projet (`tests/unit`), pour information | — | 100 % | **9/10** (M7 survit) |

Message central de l'étape 5 : **la suite « FC seule » couvre 100 % des lignes de `classifyValue`, mais la moitié des mutants survivent.** La couverture indique ce qui a été *exécuté*, pas ce qui a été *vérifié*.

Les lignes non couvertes de `thresholds.ts` (`validateThresholds`) sont hors périmètre du TP : un stagiaire qui le constate et l'explique a répondu correctement. Viser 100 % sur le fichier entier serait une dérive.

Même la suite existante du projet laisse survivre M7. Cela montre qu'aucune suite n'est complète par principe, y compris celle d'un développeur. À utiliser en synthèse.

## 7. Campagne de mutants

### 7.1 Fonctionnement

`run-mutants.ts` exécute la suite une fois sur le code d'origine (elle doit passer), puis une fois par mutant. Un mutant est **tué** si au moins un test échoue, et **survivant** si tous les tests restent verts. La substitution passe par un alias Vite : les imports `…/src/domain/thresholds` sont redirigés vers `mutant-thresholds.ts`, et **`src/` n'est jamais modifié**, ce qui respecte la règle n° 4 des exercices.

Condition d'usage : les tests doivent importer `'../../src/domain/thresholds'`, chemin relatif **sans extension**, comme dans le fichier de départ. Si un stagiaire importe autrement, tous ses mutants « survivent » : vérifier l'import avant de conclure.

### 7.2 Catalogue

| Mutant | Modification | Cas qui le tue |
|---|---|---|
| M1 | `value <= t.criticalLow` | FC 50 → W↓ |
| M2 | `value <= t.warningLow` | FC 60 → N |
| M3 | `value >= t.criticalHigh` | FC 120 → W↑ |
| M4 | `value >= t.warningHigh` | FC 100 → N |
| M5 | Alerte basse évaluée avant critique basse | FC 49 → C↓ |
| M6 | Cause `HIGH` renvoyée pour une valeur basse | `toEqual` sur l'objet complet d'un cas bas |
| M7 | `DEFAULT_THRESHOLDS` codé en dur, paramètre ignoré | Test avec seuils personnalisés |
| M8 | Garde `!== null` supprimée sur les seuils hauts | SpO₂ 98 → N |
| M9 | `Math.round(value)` avant comparaison | Température 35,9 → W↓ |
| M10 | `undefined` renvoyé au lieu de `null` | `toBeNull()` ou `toEqual(null)` |

Les sabotages S1 et S2 de l'énoncé correspondent à M1 et M4. Pour S3, les sabotages libres les plus fréquents sont M5, M6 ou une inversion de `LOW`/`HIGH` : les rattacher au catalogue lors de la correction.

### 7.3 Lecture du score

| Score | Interprétation |
|---|---|
| 10/10 | Suite complète au regard du catalogue |
| 8–9 | Bonne suite ; en général, seuls M7 (seuils personnalisés) et/ou M10 (`toBeFalsy`) survivent |
| 5–7 | Frontières correctes, mais assertions trop faibles (P2) ou composantes manquantes (P4, P5) |
| < 5 | Frontières non testées des deux côtés : reprendre l'étape 2 |

## 8. Questions à poser au Product Owner

| ID | Question | Pourquoi elle bloque un test |
|---|---|---|
| Q1 | Que doit renvoyer `classifyValue` pour `NaN`, `Infinity` ou une valeur hors domaine ? | Aujourd'hui, `NaN` renvoie `null` (NORMAL), car toutes les comparaisons avec `NaN` sont fausses. C'est sans effet dans l'application, grâce à `validateVital`, mais ce n'est pas spécifié au niveau de la fonction. |
| Q2 | Les seuils d'une composante autre que la SpO₂ peuvent-ils être `null` ? | Le type `VitalThresholds` l'autorise pour toutes les composantes, mais `validateThresholds` ne l'accepte que pour la SpO₂. |
| Q3 | La classification doit-elle se faire sur la valeur arrondie, ou sur la valeur brute ? | `classifyValue(35.95)` donne W↓, mais une saisie de 35,95 °C est arrondie à 36,0 par `validateVital`, puis classée NORMAL. Le comportement est cohérent, mais la règle est implicite. |
| Q4 | Le comportement avec des seuils incohérents (ex. `criticalLow > warningLow`) doit-il être défini ? | `validateThresholds` les rejette en amont ; `classifyValue` n'a donc aucun contrat dans ce cas. |

## 9. Éléments de réponse aux questions de recul

**Un test dont l'attendu est recalculé à partir du code peut-il détecter une erreur ?** Non, pour les erreurs d'interprétation. Si le développeur a mal lu « 50 ≤ x < 60 » et écrit `<=`, un test construit en relisant le code attendra la même chose. Seul un oracle indépendant du code (la spécification) permet de détecter l'écart. Le test reste utile comme **test de non-régression**, mais pas comme test de conformité.

**100 % de couverture suffit-il ?** Non. La suite « FC seule » couvre toutes les lignes de `classifyValue` et ne tue que 5 mutants sur 10. Une ligne exécutée n'est pas une ligne vérifiée : l'assertion peut être trop faible (sévérité seule), ou les données peuvent ne pas atteindre la frontière qui compte (entiers seulement pour la température).

**Pourquoi 49 et 50 ?** Tester 50 seul détecte M1 (`<=` sur la borne critique), mais pas un décalage de la borne vers le bas (`< 49`). Il faut tester 49 pour vérifier que la classe CRITICAL commence bien juste en dessous. Chaque borne a deux erreurs possibles, et chacune n'est visible que d'un côté.

**35,95 °C : WARNING ou NORMAL ?** `classifyValue(35.95)` renvoie W↓, ce qui est conforme au §8 (35 ≤ x < 36). Dans l'application, `validateVital` arrondit d'abord la valeur au dixième (36,0), qui est ensuite classée NORMAL. Un test unitaire vérifie une fonction **isolée** : il ne dit rien de l'enchaînement des fonctions, qui relève des tests d'intégration. C'est aussi une question pour le PO (Q3).

**`NaN` ?** La spécification ne le dit pas au niveau de `classifyValue` ; seul THR-001 garantit, au niveau du système, qu'une mesure invalide n'est jamais classée. Ce n'est ni au testeur ni à Copilot de décider le comportement : on documente le cas (`it.todo`) et on pose la question (Q1).

## 10. Grille de correction détaillée

| Critère | Points | Attendus pour le maximum |
|---|---:|---|
| Partitions et frontières, 5 composantes | 6 | Les deux côtés de chaque borne (1 pt par composante) ; température au dixième et SpO₂ sans seuil haut (1 pt) |
| Qualité des tests | 5 | `it.each` lisibles (1) ; objet complet et `toBeNull()` (2) ; attendus littéraux issus du §8 (1) ; aucun état partagé modifié (1) |
| Efficacité mesurée | 4 | S1 et S2 détectés (1) ; S3 pertinent et documenté (1) ; test ajouté après un sabotage survivant (1) ; score `run-mutants` ≥ 8/10 (1) |
| Analyse critique de Copilot | 3 | Au moins 3 corrections justifiées (2) ; hypothèse ou ambiguïté signalée (1) |
| Traçabilité et livrables | 2 | Tableau de conception relié aux tests (1) ; prompts et rapport complets (1) |
| **Total** | **20** | |

**Pénalités :** modification de `src/` laissée dans le livrable (-2) ; tests copiés de `tests/unit` (critère « qualité » plafonné à 2/5).
