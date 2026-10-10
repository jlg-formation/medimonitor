# MediMonitor — TP2 — Document B

## Prompt Microsoft Copilot : génération de cas de test fonctionnels

**Document d'entrée :** `MediMonitor_TP2_Specification_Stagiaires.docx` (document A).  
**Livrable attendu :** catalogue de tests fonctionnels en Markdown, avec matrice de traçabilité et analyse de couverture.

### Instructions d'utilisation

1. Joindre le document A à la conversation Microsoft Copilot.
2. Copier-coller intégralement le prompt ci-dessous.
3. Examiner et corriger les résultats avant de les considérer comme des cas de test validés.

---

## Prompt à copier dans Microsoft Copilot

Tu es **ingénieur de test logiciel senior (QA)**, spécialisé dans la conception de tests fonctionnels à partir d'exigences. Tu interviens sur **MediMonitor**, un simulateur pédagogique de surveillance de patients utilisant exclusivement des données fictives.

### Mission

À partir du **seul document de spécification fonctionnelle MediMonitor joint**, construis un **catalogue de cas de test manuels, reproductibles et traçables**. Le périmètre porte notamment sur :

- la classification des constantes vitales et les seuils ;
- le cycle de vie des alarmes (création, priorité, acquittement, résolution) ;
- les valeurs imposées manuellement et leur libération.

### Étape 1 — Extraction des exigences

1. Recense **toutes les exigences numérotées** présentes dans le document, avec leur identifiant exact.
2. Pour chaque exigence, résume le comportement observable attendu en une phrase.
3. Signale toute dépendance entre exigences qui influence les tests.
4. Si une règle nécessaire à un résultat attendu est absente, note-la comme **« À clarifier »** : ne la déduis pas d'un comportement habituel des dispositifs médicaux.

### Étape 2 — Conception des tests

Applique, lorsque pertinent, les techniques suivantes :

- **partitions d'équivalence** : classes normales, avertissement, critique et entrées invalides si spécifiées ;
- **analyse des valeurs limites** : juste en dessous, exactement sur, juste au-dessus des seuils ;
- **transitions d'états** : apparition, maintien, acquittement, aggravation, retour à la normale et résolution des alarmes ;
- **tests de séquences** : plusieurs actions successives, notamment override manuel, évolution simulée et libération ;
- **tests négatifs** : actions ou données refusées, uniquement lorsque le comportement attendu est défini ;
- **indépendance des patients** : vérifier qu'une action concernant un patient ne modifie pas indûment les autres, si le document le prévoit.

Évite les tests redondants : privilégie un ensemble **compact mais couvrant**, en expliquant les choix de représentativité.

### Étape 3 — Catalogue de cas de test

Présente les cas de test dans un **tableau Markdown** avec exactement les colonnes suivantes :

| ID test | Exigence(s) | Objectif | Préconditions | Étapes et données d'entrée | Résultat attendu | Technique | Priorité |
|---|---|---|---|---|---|---|---|

Contraintes :

- Identifie les tests `TC-001`, `TC-002`, etc.
- Utilise les **identifiants exacts des exigences** du document A.
- Décris les **valeurs numériques précises** et les unités lorsqu'elles sont pertinentes.
- Distingue clairement **étapes d'exécution** et **résultat observable**.
- Décris un état initial explicite pour les tests de transition.
- Ne confonds pas **priorité de l'alarme** et **statut d'acquittement**.
- Un cas de test doit pouvoir être exécuté sans interprétation supplémentaire.
- Classe la priorité du test en **P1 (essentiel)**, **P2 (important)** ou **P3 (complémentaire)**, en justifiant brièvement les P1.
- N'invente ni seuil, ni durée, ni règle de réarmement, ni comportement de l'interface.

Si une information indispensable manque, **ne fabrique pas de résultat attendu** : inscris le cas dans une section distincte « Tests bloqués / clarifications nécessaires ».

### Étape 4 — Matrice de traçabilité

Produis un second tableau :

| ID exigence | Résumé | Tests associés | Couverture | Observations |
|---|---|---|---|---|

La couverture doit être évaluée comme **Complète**, **Partielle** ou **Non couverte**, avec une justification concise. Une exigence ne doit pas être déclarée entièrement couverte au seul motif qu'un test y fait référence.

### Étape 5 — Revue critique et amélioration

Après avoir généré les tests :

1. Identifie les **frontières non testées** et les **transitions manquantes**.
2. Repère les **doublons** et les tests dont le résultat attendu n'est pas vérifiable.
3. Distingue les **faits issus du document**, les **hypothèses** et les **recommandations facultatives**.
4. Complète le catalogue uniquement avec les tests justifiés par les exigences.
5. Fournis une synthèse chiffrée : nombre d'exigences, nombre de tests, exigences couvertes complètement / partiellement / non couvertes.
6. Termine par **5 cas de test prioritaires à exécuter en premier**, avec une phrase de justification chacun.

### Règles impératives

- **Source de vérité : uniquement le document A joint.**
- Ne présente aucune hypothèse comme une règle métier validée.
- Ne modifie pas la spécification ; signale seulement les points qui empêchent de tester.
- Ne suppose pas que le simulateur est un dispositif médical réel ou certifié.
- Ne génère pas de code de test automatisé : le livrable est d'abord un **plan de tests fonctionnels manuels**.
- Écris l'intégralité de la réponse **en français**, en Markdown.
- Si la réponse est trop longue, produis-la **par lots successifs**, en conservant une numérotation continue et une matrice de traçabilité globale à la fin.

**Commence par l'inventaire des exigences, puis le catalogue de tests, la matrice de traçabilité et enfin la revue critique.**

---

## Consigne pédagogique après génération

Ne validez pas automatiquement le résultat de Copilot. Vérifiez en particulier :

- la fidélité des seuils et de leurs bornes inclusives ou exclusives ;
- l'existence d'un résultat attendu précis pour chaque test ;
- la couverture des changements d'état d'une alarme acquittée ;
- le maintien d'une valeur manuelle jusqu'à sa libération ;
- les exigences sans test, les tests sans exigence et les hypothèses ajoutées par l'IA.

**Livrable stagiaire :** catalogue corrigé + matrice de traçabilité + liste des points à clarifier.
