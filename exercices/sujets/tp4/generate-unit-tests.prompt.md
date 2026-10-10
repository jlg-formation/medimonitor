# MediMonitor — TP4 — Document B

## Prompt GitHub Copilot Chat : génération de tests unitaires pour `classifyValue`

**Outil :** GitHub Copilot Chat dans VS Code, en mode *Ask* (pas *Agent* : Copilot ne doit modifier aucun fichier lui-même).  
**Fichier cible :** `tests/tp4/classifyValue.test.ts`, contenant déjà vos tests de fréquence cardiaque (étape 3).  
**Livrable :** tests Vitest relus, corrigés puis collés **par vous** dans le fichier cible.

### Instructions d'utilisation

1. Ouvrez une **nouvelle** conversation Copilot Chat, sans historique.
2. Copiez-collez le prompt ci-dessous. Les références `#file:` joignent les fichiers au contexte. Vérifiez qu'il y en a **exactement trois**.
3. N'utilisez pas `@workspace` : Copilot risquerait de s'inspirer des tests existants du projet, que ce TP ignore.
4. Relisez la réponse avec la liste de contrôle de l'énoncé (étape 4), puis intégrez les tests à la main.
5. Lancez `npm run test:tp4`. Si un test échoue, **ne corrigez pas le résultat attendu sans avoir relu le §8 de la spécification** : soit le test est faux, soit vous avez trouvé un écart à signaler.

---

## Prompt à copier dans GitHub Copilot Chat

Tu es **ingénieur de test logiciel senior**, spécialisé dans les tests unitaires TypeScript avec **Vitest**. Tu interviens sur **MediMonitor**, un simulateur pédagogique de surveillance de patients, aux données entièrement fictives.

### Contexte fourni

- #file:docs/specification.md : la section **§8 « Seuils pédagogiques et classification »** est la **seule source de vérité** pour les résultats attendus.
- #file:src/domain/thresholds.ts : contient la fonction testée `classifyValue(key, value, thresholds)` et `DEFAULT_THRESHOLDS`.
- #file:tests/tp4/classifyValue.test.ts : mes tests existants pour la fréquence cardiaque. Reprends leur style.

### Mission

Complète ma suite de tests unitaires de `classifyValue` avec :

1. Un bloc `describe` par composante restante : `spo2`, `temperature`, `systolic`, `diastolic`.
2. Un bloc `describe` « utilisation du paramètre thresholds », qui prouve que la fonction applique les seuils **reçus en paramètre** et non des valeurs par défaut codées en dur.

### Conception des cas

Pour chaque composante, applique :

- les **partitions d'équivalence** : une valeur représentative par classe (CRITICAL bas, WARNING bas, NORMAL, WARNING haut, CRITICAL haut), uniquement pour les classes qui existent au §8 ;
- l'**analyse des valeurs limites** : à chaque frontière, la dernière valeur d'une classe et la première de la suivante. Respecte strictement le caractère inclusif (`≤`) ou exclusif (`<`) de chaque borne ;
- pour la **température**, des valeurs décimales au dixième près (exemple : 35,9 et 36) ;
- pour la **SpO₂**, au moins une valeur élevée (98 et 100) qui doit rester NORMAL, puisque le §8 ne définit aucun seuil haut.

### Contraintes de rédaction

- Utilise `it.each` avec un tableau `[valeur, résultatAttendu]` par composante.
- Le résultat attendu est soit `null` (NORMAL), soit l'objet complet `{ cause: 'LOW' | 'HIGH', severity: 'WARNING' | 'CRITICAL' }`, vérifié avec `toEqual`.
- Ne vérifie jamais la seule sévérité ; ne remplace jamais `null` par `toBeFalsy()` ou `undefined`.
- Pour des seuils personnalisés, pars de `structuredClone(DEFAULT_THRESHOLDS)` ; ne modifie jamais `DEFAULT_THRESHOLDS` directement.
- Importe uniquement depuis `'vitest'`, `'../../src/domain/thresholds'` et, pour les types, `'../../src/domain/model'`.
- Ajoute un commentaire court sur chaque valeur frontière, indiquant la borne testée.

### Règles impératives

- **Les résultats attendus proviennent du tableau du §8, jamais du code de `classifyValue`.** Ne recalcule pas un résultat attendu en exécutant mentalement la fonction.
- Si le code te semble contredire le §8, **ne modifie ni le code ni le résultat attendu** : signale l'écart dans un commentaire `// ÉCART :` et dans ta réponse.
- N'invente aucun seuil, aucune composante et aucune règle absents du §8.
- Ne lis pas et ne réutilise pas les fichiers de `tests/unit` ou `tests/integration`.
- Ne modifie aucun fichier de `src/` et n'ajoute aucune dépendance.

### Format de la réponse

1. Un tableau Markdown récapitulatif : composante | valeur | partition | résultat attendu | borne testée.
2. Le code TypeScript des nouveaux blocs `describe`, prêt à être collé à la suite de mes tests.
3. La liste des **hypothèses** que tu as dû faire, et des **points de la spécification** que tu juges ambigus pour les tests.

Écris tes explications **en français**.

---

## Consigne pédagogique après génération

Ne collez pas la réponse telle quelle. Vérifiez en particulier :

- chaque valeur frontière, ligne par ligne, avec le tableau du §8 ;
- la présence de décimales pour la température ;
- l'absence de seuil haut inventé pour la SpO₂ ;
- la précision des assertions (objet complet, `toBeNull()`) ;
- l'existence d'un test qui **échouerait** si la fonction ignorait son paramètre `thresholds`.

Notez dans `prompts_tp4.md` les relances éventuelles (exemple : « tu as oublié la frontière 140/141 de la systolique »), et dans `rapport_tp4.md` ce que vous avez corrigé.
