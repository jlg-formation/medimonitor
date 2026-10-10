# TP3 — Étape 1 : génération d'un plan de couverture des données de test

## Rôle

Tu es un ingénieur QA senior, spécialisé dans la conception de tests fonctionnels et la génération de données de test.

Tu disposes en pièce jointe de la spécification fonctionnelle **MediMonitor — TP2 — Version 1.0**.

## Mission

Analyse cette spécification et produis un **plan de couverture des données de test au format Markdown**.

Ce plan servira à préparer un jeu de données synthétiques permettant de vérifier les exigences fonctionnelles de MediMonitor.

**Attention : à cette étape, tu ne dois pas générer les données de test elles-mêmes.**

## 1. Identifier les règles à couvrir

Extrais les règles fonctionnelles relatives :

- Aux constantes vitales surveillées.
- Aux seuils NORMAL, WARNING et CRITICAL.
- Aux valeurs limites.
- Aux mesures indisponibles.
- Aux transitions entre états.
- Aux règles de cohérence entre mesures.

Pour chaque règle, indique sa référence dans la spécification.

## 2. Construire les partitions d'équivalence

Pour chaque constante vitale, identifie :

- Les classes de valeurs normales.
- Les classes de valeurs WARNING.
- Les classes de valeurs CRITICAL.
- Les valeurs frontières exactes.
- Les éventuelles valeurs absentes ou invalides.

Présente les résultats dans des tableaux Markdown.

Distingue les règles explicitement définies des hypothèses qui nécessitent une clarification.

## 3. Définir les scénarios temporels

Propose des séquences de mesures permettant de couvrir notamment :

- NORMAL → WARNING.
- WARNING → CRITICAL.
- CRITICAL → WARNING.
- WARNING → NORMAL.
- CRITICAL → NORMAL.
- NORMAL → WARNING après une précédente résolution.
- Mesure disponible → indisponible → disponible.
- État stable sur plusieurs mesures.

Pour chaque scénario, précise les valeurs ou classes de valeurs nécessaires et les exigences concernées.

## 4. Préparer la répartition des données

Nous souhaitons ensuite produire un fichier CSV comportant :

- 8 patients fictifs, identifiés de P-001 à P-008.
- 11 instants de mesure par patient, de la minute 0 à la minute 10.
- Soit **88 enregistrements au total**.

Propose une répartition des scénarios entre les huit patients afin de maximiser la couverture.

Une même ligne peut contribuer à couvrir plusieurs exigences.

## 5. Produire une matrice de couverture

Construis un tableau Markdown contenant :

| ID couverture | Exigence source | Comportement à couvrir | Données nécessaires | Patient/scénario proposé | Priorité |

Vérifie qu'aucune règle importante de la spécification n'a été oubliée.

## 6. Identifier les limites et les arbitrages

Signale explicitement :

- Les règles insuffisamment définies.
- Les éventuelles contradictions entre la spécification et les contraintes du jeu de données.
- Les comportements qui ne peuvent pas être vérifiés à partir d'un simple CSV.
- Les hypothèses nécessitant une validation.

Ne complète jamais une règle métier manquante par une invention.

## Format de sortie

Produis un document Markdown structuré avec les sections suivantes :

1. Objectif et périmètre.
2. Règles fonctionnelles extraites.
3. Partitions d'équivalence et valeurs limites.
4. Scénarios de transitions.
5. Répartition des huit patients.
6. Matrice de couverture.
7. Points à clarifier.
8. Bilan de couverture.

Le document doit être suffisamment précis pour servir d'entrée à une seconde étape de génération de données CSV.

## Contraintes impératives

- Utilise la spécification jointe comme source de vérité pour les règles fonctionnelles.
- Ne confonds pas les données d'entrée avec les résultats observés de l'application.
- N'invente pas de seuil médical.
- Cite les identifiants des exigences concernées.
- Ne génère ni CSV ni code à cette étape.
- Privilégie une couverture pertinente plutôt qu'un grand nombre de valeurs aléatoires.

**Commence directement par le plan de couverture en Markdown.**