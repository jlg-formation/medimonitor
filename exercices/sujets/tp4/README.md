# MediMonitor — TP4 : Premiers tests unitaires automatisés

**Document A — Énoncé stagiaire**  
**Version :** 1.0 · **Durée indicative :** 90 minutes  
**Outils :** VS Code, GitHub Copilot Chat, Node.js, Vitest

## 1. Contexte

Aux TP2 et TP3, vous avez conçu des cas de test et des jeux de données **sans exécuter l'application**. Dans ce TP4, vous passez de l'autre côté : vous écrivez des **tests unitaires automatisés** qui appellent directement une fonction du code de MediMonitor et vérifient son résultat.

La fonction étudiée est **`classifyValue`**, dans [`src/domain/thresholds.ts`](../../../src/domain/thresholds.ts). Elle classe la valeur d'une constante vitale par rapport aux seuils : NORMAL, WARNING ou CRITICAL, avec une cause LOW (trop bas) ou HIGH (trop haut).

Le projet contient déjà des tests (`tests/unit`, `tests/integration`). **Ce TP les ignore volontairement** : vous construisez votre propre suite, à partir de la spécification. Ne les ouvrez pas, ne les copiez pas et ne les fournissez pas à Copilot.

## 2. Objectifs pédagogiques

À l'issue du TP, vous devez être capable de :

1. Lire la signature d'une fonction et en déduire ce qu'un test doit lui fournir et vérifier.
2. Écrire un test unitaire Vitest structuré en *Arrange / Act / Assert*.
3. Traduire des partitions d'équivalence et des valeurs limites en tests paramétrés (`it.each`).
4. Prendre la **spécification** comme oracle, et non le code testé.
5. Faire générer des tests par Copilot, puis les relire et les corriger de façon critique.
6. Comprendre qu'une couverture de code de 100 % ne prouve pas qu'une suite est efficace.

## 3. Référence fonctionnelle

### 3.1 Règles de classification (spécification §8)

| Composante | Clé | CRITICAL | WARNING | Sinon |
|---|---|---|---|---|
| Fréquence cardiaque (bpm) | `heartRate` | x < 50 ou x > 120 | 50 ≤ x < 60 ou 100 < x ≤ 120 | NORMAL |
| SpO₂ (%) | `spo2` | x < 92 | 92 ≤ x < 95 | NORMAL |
| Température (°C) | `temperature` | x < 35 ou x > 39 | 35 ≤ x < 36 ou 38 < x ≤ 39 | NORMAL |
| Pression systolique (mmHg) | `systolic` | x < 90 ou x > 160 | 90 ≤ x < 100 ou 140 < x ≤ 160 | NORMAL |
| Pression diastolique (mmHg) | `diastolic` | x < 60 ou x > 100 | 60 ≤ x < 65 ou 90 < x ≤ 100 | NORMAL |

Critère d'acceptation **AC-03** : avec les seuils par défaut, 120 bpm → WARNING, 121 bpm → CRITICAL, 100 bpm → NORMAL.

> **Rappel :** ces seuils sont fictifs et pédagogiques. Ils ne constituent pas des recommandations médicales.

### 3.2 La fonction testée

```ts
classifyValue(key: VitalKey, value: number, thresholds: Thresholds): Condition | null
```

| Paramètre / retour | Signification |
|---|---|
| `key` | Composante : `'heartRate'`, `'spo2'`, `'temperature'`, `'systolic'` ou `'diastolic'` |
| `value` | Valeur numérique **déjà validée** |
| `thresholds` | Seuils à appliquer, par exemple `DEFAULT_THRESHOLDS` (exporté par le même module) |
| retour `null` | La valeur est **NORMAL** |
| retour `{ cause, severity }` | `cause` vaut `'LOW'` ou `'HIGH'` ; `severity` vaut `'WARNING'` ou `'CRITICAL'` |

Les seuils d'une composante ont la forme `{ criticalLow, warningLow, warningHigh, criticalHigh }`. Pour la SpO₂, `warningHigh` et `criticalHigh` valent `null` : il n'y a pas de seuil haut.

**Règle d'or :** le résultat attendu de chaque test provient du tableau ci-dessus. Si le code et la spécification divergent, **le test suit la spécification** et l'écart est signalé dans votre rapport. On n'ajuste jamais un résultat attendu pour qu'un test passe.

## 4. Mise en place (avant le TP)

```bash
npm install
mkdir tests/tp4
cp exercices/sujets/tp4/classifyValue.test.ts tests/tp4/
npm run test:tp4
```

Le fichier de départ contient deux tests ; vous devez obtenir **2 passed**. La commande `npm run test:tp4` n'exécute que le dossier `tests/tp4` : les tests existants du projet ne sont pas lancés.

## 5. Travail demandé

### Étape 1 — Lire le code et le premier test (10 min)

1. Ouvrez [`src/domain/thresholds.ts`](../../../src/domain/thresholds.ts) et lisez `classifyValue` (8 lignes).
2. Ouvrez `tests/tp4/classifyValue.test.ts` et identifiez `describe`, `it`, `expect`, et les trois blocs *Arrange / Act / Assert*.
3. Répondez par écrit :
   - Que renvoie la fonction pour une valeur NORMAL ? Pourquoi un test doit-il utiliser `toBeNull()` plutôt que `toBeFalsy()` ?
   - Pourquoi le premier test utilise-t-il `toEqual` et pas `toBe` pour comparer un objet ?
   - Quel rôle joue le troisième paramètre `thresholds` ? Comment vérifier que la fonction l'utilise vraiment ?
4. Faites échouer volontairement un test (changez `'CRITICAL'` en `'WARNING'`), lancez `npm run test:tp4`, lisez le message d'erreur, puis annulez la modification.

### Étape 2 — Concevoir les cas à la main, sans Copilot (15 min)

Pour la **fréquence cardiaque**, construisez le tableau des cas de test **à partir du §3.1** :

| ID | Composante | Valeur | Partition | Résultat attendu (`cause`, `severity` ou `null`) | Justification |
|---|---|---|---|---|---|
| UT-FC-01 | heartRate | 30 | CRITICAL bas | `{ LOW, CRITICAL }` | x < 50 |
| … | | | | | |

Exigences minimales :

- une valeur **représentative** de chacune des 5 partitions (CRITICAL bas, WARNING bas, NORMAL, WARNING haut, CRITICAL haut) ;
- à **chaque frontière**, la dernière valeur d'une classe **et** la première de la suivante (exemple : 49 et 50) ;
- les trois valeurs d'AC-03.

Combien de cas obtenez-vous ? Lesquels sont redondants ?

### Étape 3 — Écrire vos premiers tests (15 min)

Transformez votre tableau FC en tests dans `tests/tp4/classifyValue.test.ts`.

1. Écrivez d'abord **trois tests séparés** (un `it` par cas), au format du fichier de départ.
2. Regroupez ensuite tous les cas FC dans **un seul test paramétré** `it.each` (voir l'aide-mémoire §9).
3. Vérifiez l'**objet complet** (`toEqual({ cause: 'LOW', severity: 'WARNING' })`), pas seulement la sévérité.
4. Lancez `npm run test:tp4` après chaque modification.

### Étape 4 — Étendre la suite avec Copilot (20 min)

Utilisez le prompt fourni (**document B** : [`generate-unit-tests.prompt.md`](generate-unit-tests.prompt.md)) pour faire générer par GitHub Copilot Chat les tests des **quatre autres composantes**, ainsi qu'un test vérifiant l'utilisation du paramètre `thresholds`.

Relisez **chaque** test proposé avant de l'accepter :

- [ ] Le résultat attendu provient-il du §3.1, ou a-t-il été recalculé à partir du code ?
- [ ] Chaque frontière est-elle testée des deux côtés ? La température est-elle testée avec des **décimales** (35,9 ; 38,1…) ?
- [ ] La SpO₂ a-t-elle un cas élevé (98, 100) qui doit rester NORMAL ? Copilot a-t-il inventé un seuil haut ?
- [ ] Les assertions vérifient-elles `cause` **et** `severity` ? `null` est-il vérifié avec `toBeNull()` ?
- [ ] Au moins un test utilise-t-il des seuils **personnalisés** au lieu de `DEFAULT_THRESHOLDS` ?
- [ ] Copilot a-t-il modifié `src/`, ajouté une dépendance ou lu `tests/unit` ? Si oui, refusez.

Notez dans votre rapport chaque correction apportée au code généré.

### Étape 5 — Mesurer l'efficacité de la suite (15 min)

**a) Couverture de code.** Lancez :

```bash
npm run test:tp4:coverage
```

Relevez le taux de lignes et de branches couvertes pour `thresholds.ts` (rapport détaillé : `coverage/tp4/index.html`). Les lignes de `classifyValue` sont-elles toutes couvertes ? Quelles fonctions du fichier ne le sont pas, et est-ce un problème pour ce TP ?

**b) Sabotage volontaire.** Une suite de tests est utile si elle **échoue quand le code est faux**. Dans `src/domain/thresholds.ts`, introduisez **une seule** des modifications suivantes, lancez `npm run test:tp4`, notez le résultat, puis **annulez** la modification avant de passer à la suivante :

| Sabotage | Modification dans `classifyValue` |
|---|---|
| S1 | `value < t.criticalLow` devient `value <= t.criticalLow` |
| S2 | `value > t.warningHigh` devient `value >= t.warningHigh` |
| S3 | Votre propre sabotage : une modification réaliste qu'un développeur aurait pu faire par erreur |

```bash
git restore src/domain/thresholds.ts   # annule le sabotage
git status                             # src/ ne doit plus apparaître comme modifié
```

Si un sabotage n'est pas détecté (les tests restent verts), ajoutez le test manquant, puis vérifiez qu'il détecte bien le sabotage.

### Étape 6 — Synthèse (15 min)

Rédigez `rapport_tp4.md` : nombre de tests, cas couverts par composante, corrections apportées aux propositions de Copilot, résultats de la couverture et des sabotages, écarts éventuels entre code et spécification, questions à poser au Product Owner.

**Pour aller plus loin :** testez `conditionFor` (même fichier), qui applique l'exigence **THR-001** : une mesure `INVALID` ou `UNAVAILABLE` ne produit qu'une sévérité `INFORMATION`, jamais WARNING ou CRITICAL.

## 6. Livrables attendus

1. **`tests/tp4/classifyValue.test.ts`** : suite de tests exécutable, verte sur le code d'origine.
2. **`rapport_tp4.md`** : tableau de conception (étape 2), revue des tests générés, couverture, sabotages, écarts et questions.
3. **`prompts_tp4.md`** : prompts utilisés et brève explication de leur évolution.

## 7. Critères de réussite

| Critère | Points |
|---|---:|
| Couverture des partitions et des frontières, pour les 5 composantes | 6 |
| Qualité des tests : lisibilité, assertions précises, tests paramétrés, oracle issu de la spécification | 5 |
| Efficacité mesurée : sabotages détectés, tests ajoutés après un sabotage non détecté | 4 |
| Analyse critique des propositions de Copilot | 3 |
| Traçabilité et clarté des livrables | 2 |
| **Total** | **20** |

## 8. Questions de recul

- Un test dont le résultat attendu a été calculé en relisant le code peut-il détecter une erreur du code ?
- Votre suite atteint 100 % de couverture des lignes de `classifyValue`. Est-elle pour autant suffisante ? Appuyez-vous sur vos sabotages.
- Pourquoi tester 49 **et** 50, et pas seulement 50 ?
- `classifyValue(35.95)` renvoie WARNING, alors qu'une température saisie de 35,95 °C s'affiche NORMAL dans l'application. Quelle autre fonction intervient avant `classifyValue` ? Qu'est-ce que cela dit de la portée d'un test **unitaire** ?
- Que devrait renvoyer `classifyValue` pour `NaN` ? La spécification le dit-elle ? Qui doit trancher ?

## 9. Aide-mémoire Vitest

```ts
import { describe, expect, it } from 'vitest';
import { classifyValue, DEFAULT_THRESHOLDS } from '../../src/domain/thresholds';

describe('groupe de tests', () => {
  it('un test', () => {
    expect(1 + 1).toBe(2);                                    // égalité stricte (nombres, chaînes)
    expect({ a: 1 }).toEqual({ a: 1 });                       // égalité de contenu (objets)
    expect(classifyValue('spo2', 98, DEFAULT_THRESHOLDS)).toBeNull(); // exactement null
  });

  // Test paramétré : une ligne du tableau = un test exécuté
  it.each([
    [49, { cause: 'LOW', severity: 'CRITICAL' }],
    [50, { cause: 'LOW', severity: 'WARNING' }],
    [60, null],
  ])('FC %s bpm → %o', (value, expected) => {
    expect(classifyValue('heartRate', value, DEFAULT_THRESHOLDS)).toEqual(expected);
  });
});
```

Pour créer des seuils personnalisés sans modifier `DEFAULT_THRESHOLDS` :

```ts
const custom = structuredClone(DEFAULT_THRESHOLDS);
custom.heartRate = { criticalLow: 80, warningLow: 90, warningHigh: 110, criticalHigh: 130 };
```

| Commande | Effet |
|---|---|
| `npm run test:tp4` | Exécute les tests de `tests/tp4` |
| `npm run test:tp4:coverage` | Idem, avec le rapport de couverture |
| `npx vitest --config exercices/sujets/tp4/vitest.config.ts` | Mode surveillance : relance les tests à chaque sauvegarde |

**Important :** importez la fonction avec le chemin relatif **sans extension** `'../../src/domain/thresholds'`, comme dans le fichier de départ.

**Rappel :** Copilot est un assistant de production. La responsabilité de la pertinence et de la validité des tests reste celle du testeur.
