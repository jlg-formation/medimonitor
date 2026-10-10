# TP3 — Étape 2 : génération du jeu de données CSV avec Microsoft Copilot

## Rôle

Tu es un ingénieur QA senior spécialisé dans la génération de données synthétiques pour les tests logiciels.

Tu disposes de deux documents joints :

1. **MediMonitor — Spécification fonctionnelle TP2**, qui définit les exigences et les règles métier.
2. **MediMonitor — Plan de couverture TP3**, qui définit les classes d'équivalence, les valeurs limites et les scénarios à couvrir.

## Mission

Génère un jeu de données synthétiques au format CSV, destiné à tester le simulateur MediMonitor.

Le fichier doit respecter la spécification et mettre en œuvre le plan de couverture.

## 1. Structure du fichier

Le CSV doit comporter exactement les colonnes suivantes, dans cet ordre :

`patientId,timestamp,heartRate,spo2,temperature,systolic,diastolic`

Contraintes :

- Séparateur : virgule.
- Encodage : UTF-8.
- Une ligne d'en-tête.
- Décimales avec un point.
- Horodatages ISO 8601 en UTC.
- Champs numériques sans unité dans les cellules.
- Mesure indisponible représentée par un champ vide, jamais par `0`, `null` ou `N/A`.

## 2. Volume et chronologie

Génère exactement **88 enregistrements** :

- 8 patients : `P-001` à `P-008`.
- 11 mesures par patient.
- Une mesure par minute, de `2026-10-10T10:00:00Z` à `2026-10-10T10:10:00Z`, bornes incluses.
- Aucun doublon du couple `(patientId, timestamp)`.
- Tri par `patientId`, puis par `timestamp` croissant.

## 3. Respect du plan de couverture

Reprends les scénarios attribués aux huit patients dans le plan de couverture.

Le jeu de données doit notamment contenir :

- Des mesures normales stables.
- Des valeurs WARNING.
- Des valeurs CRITICAL.
- Des valeurs situées exactement aux frontières des seuils.
- Des dégradations progressives.
- Des récupérations.
- Des transitions entre niveaux de gravité.
- Au moins une mesure indisponible suivie d'un retour à une valeur disponible.

Ne remplace pas les valeurs frontières par des valeurs approximatives.

Chaque scénario doit pouvoir être identifié et vérifié dans les données générées.

## 4. Cohérence des données

Respecte les règles définies dans la spécification.

En particulier :

- Les valeurs doivent être cohérentes avec les seuils fonctionnels.
- La pression systolique doit rester supérieure à la pression diastolique lorsque les deux mesures sont disponibles.
- Les valeurs doivent respecter les formats attendus.
- Les transitions temporelles doivent être compatibles avec le scénario choisi.
- N'invente pas de contraintes médicales absentes des documents.

Si le plan de couverture contient une contradiction avec la spécification, applique la spécification et signale la divergence.

## 5. Vérification avant livraison

Avant de fournir le fichier, effectue les contrôles suivants :

1. Vérifier la présence des sept colonnes.
2. Vérifier qu'il existe exactement 88 lignes de données.
3. Vérifier la présence des huit patients.
4. Vérifier les onze horodatages de chaque patient.
5. Vérifier l'absence de doublons.
6. Vérifier la cohérence des formats numériques.
7. Vérifier les contraintes sur la pression artérielle.
8. Vérifier que les valeurs limites prévues sont présentes.
9. Vérifier que les scénarios temporels du plan de couverture sont représentés.
10. Identifier les éventuels critères de couverture non satisfaits.

Ne déclare pas un contrôle réussi sans l'avoir réellement effectué. Si tu ne disposes pas d'un outil pour vérifier le CSV, indique que le contrôle reste à effectuer.

## 6. Livrables

### Livrable principal

Crée un fichier téléchargeable nommé :

`medimonitor-test-data.csv`

Le fichier doit contenir les 88 enregistrements.

Si ton environnement ne permet pas de créer un fichier, fournis son contenu intégral dans un unique bloc de code CSV, sans lignes omises ni abréviations.

### Livrable complémentaire

Produis un court rapport Markdown intitulé :

`medimonitor-generation-report.md`

Il doit contenir :

- Le nombre d'enregistrements générés.
- La répartition des scénarios par patient.
- Les critères de couverture satisfaits.
- Les critères éventuellement non satisfaits.
- Les hypothèses ou arbitrages effectués.
- Les contrôles réellement exécutés.

## Contraintes impératives

- Utilise exclusivement les deux documents fournis.
- Ne modifie pas les seuils de la spécification.
- Ne génère pas de valeurs au hasard si cela compromet la couverture.
- Ne produis pas de lignes supplémentaires.
- Ne confonds pas absence de mesure et valeur numérique zéro.
- Ne présente pas le jeu de données comme des observations médicales réelles.

**Commence par générer le fichier CSV, puis produis le rapport de génération.**