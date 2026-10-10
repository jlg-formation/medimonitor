# TP3 — Étape 3 : visualisation du jeu de données de test

## Rôle

Tu es un développeur front-end senior spécialisé dans la visualisation de données et les interfaces de supervision.

Tu disposes de trois documents joints :

1. **MediMonitor — Spécification fonctionnelle TP2**, qui définit les constantes vitales, les seuils et les niveaux de gravité.
2. **MediMonitor — Plan de couverture TP3**, qui décrit les scénarios attribués à chaque patient.
3. **`medimonitor-test-data-corrige.csv`**, le jeu de données synthétiques produit à l'étape précédente.

## Mission

Réalise une page web autonome, `index.html`, qui permet de visualiser les courbes du jeu de données CSV.

Elle doit permettre à un testeur de vérifier visuellement, patient par patient, que chaque scénario du plan de couverture est bien représenté : valeurs normales, valeurs WARNING et CRITICAL, valeurs frontières, transitions et mesures absentes.

## 1. Contraintes techniques

- Un seul fichier HTML, avec le CSS et le JavaScript intégrés.
- Aucune dépendance externe : ni bibliothèque de graphiques, ni CDN, ni framework. La page doit fonctionner hors ligne.
- Graphiques tracés en SVG avec du JavaScript natif.
- Page ouvrable directement depuis le disque (`file://`), sans serveur.
- Interface entièrement en français.
- Mise en page adaptée aux écrans larges comme aux écrans étroits (jusqu'à 360 px).
- Prise en charge du thème clair et du thème sombre (`prefers-color-scheme`).

## 2. Chargement des données

Le CSV a le format suivant :

`patientId,timestamp,heartRate,spo2,temperature,systolic,diastolic`

Exigences :

- La page tente d'abord de lire `medimonitor-test-data-corrige.csv`, placé dans le même dossier.
- Si la lecture échoue, par exemple parce que le navigateur bloque `fetch` en `file://`, la page utilise une copie du CSV intégrée au HTML.
- Un bouton permet d'ouvrir un autre fichier CSV de même format.
- L'en-tête de la page indique la source effectivement utilisée, ainsi que le nombre de patients et de mesures.
- Un champ vide ou non numérique est traité comme une **mesure absente**, jamais comme la valeur `0`.
- Les mesures sont regroupées par patient, puis triées par horodatage.
- Un CSV illisible produit un message d'erreur explicite au lieu d'une page vide.

## 3. Règles de classification

Reprends exactement les seuils par défaut de la spécification :

| Constante | Critique bas | Alerte bas | Alerte haut | Critique haut | Unité |
|---|---|---|---|---|---|
| Fréquence cardiaque | 50 | 60 | 100 | 120 | bpm |
| SpO₂ | 92 | 95 | — | — | % |
| Température | 35 | 36 | 38 | 39 | °C |
| Pression systolique | 90 | 100 | 140 | 160 | mmHg |
| Pression diastolique | 60 | 65 | 90 | 100 | mmHg |

Applique la règle de classification suivante, dans cet ordre :

1. `x < critique bas` → CRITICAL.
2. `x < alerte bas` → WARNING.
3. `x > critique haut` → CRITICAL.
4. `x > alerte haut` → WARNING.
5. Sinon → NORMAL.

Les comparaisons sont **strictes** : une valeur égale à un seuil reste dans la classe la moins grave. Par exemple, une fréquence cardiaque de 120 bpm est en WARNING, et une de 121 bpm est CRITICAL.

Une mesure absente n'est pas classée NORMAL : elle est signalée comme « absente / invalide ».

Ne modifie aucun seuil et n'ajoute aucune règle médicale absente de la spécification.

## 4. Visualisation

### Navigation

- Un onglet par patient.
- Chaque onglet porte un indicateur du niveau de gravité le plus élevé atteint par le patient.
- Sous les onglets, un résumé textuel indique, pour chaque constante concernée, la plage de valeurs observée et le nombre de mesures en alerte, critiques ou absentes.

### Graphiques

- Un graphique en courbe par constante : fréquence cardiaque, SpO₂, température, pression systolique et pression diastolique.
- Un seul axe vertical par graphique. Ne superpose pas deux grandeurs dont les seuils diffèrent sur un même graphique.
- Échelle verticale fixe par constante, couvrant tous les seuils, pour que les patients restent comparables. L'échelle s'élargit automatiquement si une valeur en sort.
- Axe horizontal en heure UTC (`HH:MM`).
- Zones de fond colorées pour les plages WARNING et CRITICAL, et lignes de seuil en pointillés étiquetées avec leur valeur.
- Un marqueur par mesure, coloré selon sa gravité.
- Une mesure absente interrompt la courbe et apparaît sous la forme d'un repère « absent » sur l'axe horizontal.

### Interaction

- Au survol, ou au toucher sur mobile, un curseur vertical s'aligne sur la mesure la plus proche, simultanément sur tous les graphiques.
- Un bandeau de lecture, qui reste visible au défilement, affiche pour cet instant les valeurs des quatre constantes, avec leur unité et leur classification. Les pressions sont affichées sous la forme systolique/diastolique.
- Sans survol, le bandeau affiche par défaut l'instant le plus anormal du patient.

### Accessibilité

- La gravité n'est jamais transmise par la couleur seule : chaque couleur est accompagnée d'un libellé (« Alerte haute », « Critique bas », etc.).
- Une légende explique les zones et les marqueurs.
- Un tableau dépliable présente toutes les mesures du patient, avec la classification de chaque valeur.
- Les couleurs de gravité (alerte, critique) sont réservées à cet usage et ne servent pas à distinguer des séries.

## 5. Vérification avant livraison

Avant de livrer la page, effectue les contrôles suivants :

1. Ouvrir la page en `file://` et vérifier qu'elle utilise la copie intégrée sans erreur bloquante.
2. Vérifier que les huit patients et les 88 mesures sont chargés.
3. Vérifier les valeurs frontières, par exemple pour P-006 : 140 → NORMAL, 141 → WARNING, 160 → WARNING, 161 → CRITICAL.
4. Vérifier que la SpO₂ absente de P-008 interrompt la courbe et n'est pas tracée à 0.
5. Vérifier la synchronisation du curseur et du bandeau de lecture.
6. Vérifier le rendu en thème sombre et sur un écran étroit.
7. Contrôler visuellement l'absence de chevauchement entre étiquettes.

Ne déclare pas un contrôle réussi sans l'avoir réellement effectué. Si tu ne disposes pas d'un navigateur pour tester la page, indique que le contrôle reste à effectuer.

## 6. Livrable

Crée le fichier :

`index.html`

à placer dans le même dossier que le CSV.

Accompagne-le d'un court compte rendu indiquant :

- Les choix de représentation effectués et leur justification.
- Le mode de chargement des données et ses limites. Par exemple, la copie intégrée n'est pas mise à jour automatiquement si le CSV change.
- Les contrôles réellement exécutés et leur résultat.

## Contraintes impératives

- Utilise exclusivement les seuils de la spécification.
- Ne confonds pas mesure absente et valeur zéro.
- N'utilise pas de graphique à double axe vertical.
- Ne modifie pas les données du CSV.
- Ne présente pas les données comme des observations médicales réelles : rappelle en pied de page que les seuils sont pédagogiques et fictifs.

**Commence par analyser le CSV et les scénarios du plan de couverture, puis produis la page.**
