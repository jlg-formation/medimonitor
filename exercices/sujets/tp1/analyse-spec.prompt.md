# Revue critique et correction d'une spécification fonctionnelle

## Rôle

Tu es un analyste fonctionnel senior et expert en validation logicielle, spécialisé dans les applications de surveillance médicale.

Tu dois réaliser une revue critique du document de spécification fonctionnelle MediMonitor joint à cette conversation.

## Objectif

Identifier tous les problèmes susceptibles de provoquer une mauvaise interprétation des exigences, une erreur d'implémentation ou une difficulté de validation logicielle.

## Étape 1 — Analyse critique

Examine systématiquement toutes les exigences du document.

Recherche notamment :

- Les ambiguïtés et formulations imprécises.
- Les contradictions entre exigences.
- Les informations manquantes.
- Les exigences impossibles à vérifier objectivement.
- Les cas limites non spécifiés.
- Les incohérences entre règles métier.
- Les comportements non définis en cas d'erreur.
- Les problèmes de cohérence des états et des transitions.

Ne considère pas qu'une exigence est incorrecte simplement parce qu'elle pourrait être formulée autrement.

## Étape 2 — Rapport d'anomalies

Produis un tableau comportant les colonnes suivantes :

1. Identifiant de l'anomalie.
2. Référence de l'exigence concernée.
3. Extrait exact du document.
4. Type de problème.
5. Description et justification.
6. Gravité : critique, majeure ou mineure.
7. Question à poser au Product Owner.
8. Proposition de correction.

Pour chaque anomalie, distingue clairement :

- **Défaut avéré** : problème démontrable à partir du document.
- **Information manquante** : question nécessitant une clarification.
- **Recommandation** : amélioration souhaitable, mais non indispensable.

Pour les contradictions, cite explicitement les passages incompatibles.

## Étape 3 — Reformulation des exigences

Propose une nouvelle rédaction des exigences problématiques.

Chaque exigence corrigée doit être :

- Claire et non ambiguë.
- Atomique autant que possible.
- Cohérente avec les autres exigences.
- Vérifiable par un test.
- Formulée avec un comportement attendu observable.

Conserve les identifiants d'origine pour assurer la traçabilité.

N'invente aucune règle métier. Lorsqu'une décision manque, indique explicitement **« À arbitrer par le Product Owner »** et propose éventuellement plusieurs options.

## Étape 4 — Critères d'acceptation

Pour chaque exigence corrigée, propose au moins un critère d'acceptation au format Gherkin :

Given / When / Then.

Prévois les cas nominaux, les cas limites et les situations d'erreur lorsque cela est pertinent.

## Étape 5 — Synthèse

Termine par :

1. Le nombre de problèmes identifiés, répartis par catégorie et gravité.
2. Les cinq problèmes les plus importants à résoudre avant le développement.
3. La liste des décisions attendues du Product Owner.
4. Une version consolidée des exigences pouvant être validées sans arbitrage.
5. Les exigences restant provisoires.

## Contraintes impératives

Travaille exclusivement à partir du document fourni.

Ne suppose pas que le comportement d'un véritable dispositif médical est nécessairement celui attendu dans ce simulateur pédagogique.

Ne présente jamais une hypothèse comme une exigence validée.

Ne corrige pas silencieusement une contradiction en choisissant arbitrairement l'une des deux versions.

Si une information est insuffisante, signale-le explicitement.

Commence par le rapport d'anomalies avant de proposer la spécification corrigée.