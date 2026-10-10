# MediMonitor

Simulation pédagogique d'une station centrale de surveillance de huit patients fictifs.
**SIMULATION — NE PAS UTILISER POUR DES SOINS.** Seuils fictifs, non validés médicalement.

Spécification et décisions d'implémentation : [docs/specification.md](docs/specification.md).

## Démarrage

```bash
npm install
npm run dev          # serveur de développement
npm run build        # build statique dans dist/
```

## Qualité

```bash
npm run lint
npm run typecheck
npm test             # Vitest : unitaires + intégration
npx playwright install chromium
npm run test:e2e     # Playwright, build servi sous /medimonitor/ comme sur GitHub Pages
E2E_EDGE=1 npm run test:e2e   # ajoute Microsoft Edge (si installé)
```

## Architecture

- `src/domain/` : cœur métier pur et déterministe (scénarios, validation, seuils, alarmes, moteur `reduce`). Aucun React, aucun `Math.random()` ni `Date.now()`.
- `src/state/` : provider React, scheduler (temps réel → pas virtuels), persistance `localStorage` des réglages.
- `src/pages/`, `src/components/` : interface, sans logique métier dupliquée.

## Déploiement

Le workflow `.github/workflows/ci.yml` exécute lint, types, tests, build et E2E, puis déploie `dist/` sur GitHub Pages à chaque push sur `main`.
Activer Pages dans le dépôt : *Settings → Pages → Source : GitHub Actions*.
