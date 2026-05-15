# Running Dashboard

Running Dashboard est un projet web réalisé dans le cadre de ma reprise du développement web.

L'objectif est de transformer mes données réelles de course à pied, exportées depuis un Google Sheets, en tableau de bord interactif avec statistiques, objectifs, filtres et historique des sorties.

## Démo en ligne

Le projet est disponible ici :

https://hugog83.github.io/running-dashboard/

## Objectif du projet

Ce projet m'a permis de pratiquer les bases du développement front-end avec JavaScript, en travaillant sur des données réelles plutôt que sur un exercice fictif.

Le dashboard permet de visualiser rapidement ma progression en course à pied sur plusieurs années.

## Fonctionnalités

- Chargement de plusieurs fichiers CSV
- Fusion des données de course de 2024, 2025 et 2026
- Calcul des statistiques globales :
  - distance totale
  - nombre de sorties
  - temps total
  - vitesse moyenne
- Statistiques détaillées par année
- Affichage des meilleures performances :
  - plus longue sortie
  - sortie la plus rapide
- Affichage des objectifs de course
- Tableau d'historique des sorties
- Filtre par année
- Tri par date, distance, vitesse ou durée
- Filtre pour afficher uniquement les sorties de 10 km ou plus
- Design responsive adapté au mobile
- Transformation du tableau en cards sur mobile

## Technologies utilisées

- HTML5
- CSS3
- JavaScript
- Fetch API
- CSV
- Git
- GitHub
- GitHub Pages

## Structure du projet

```txt
running-dashboard/
├── data/
│   ├── running-2024.csv
│   ├── running-2025.csv
│   ├── running-2026.csv
│   └── running-objectives.csv
├── index.html
├── style.css
├── script.js
└── README.md