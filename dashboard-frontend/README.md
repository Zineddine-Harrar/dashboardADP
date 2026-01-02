# 🧹 Cleaning Analytics Platform - DATALIAN

Plateforme SaaS complète pour la planification et l'analyse des tâches de nettoyage avec traitement de données Excel et visualisations en temps réel.

## 📋 Description

Ce projet est une solution complète de gestion et d'analyse de données pour les opérations de nettoyage. Il se compose de :

- **Backend NestJS** - API REST avec ETL pour traiter les fichiers Excel
- **Dashboard HTML** - Interface de visualisation avec graphiques et métriques
- **Frontend React** - Application moderne de gestion des vacations
- **Page d'Upload** - Interface pour importer des fichiers ZIP contenant des données Excel

## 🚀 Fonctionnalités

### Backend (`cleaning-saas-backend/`)
- ✅ Upload de fichiers Excel (simples ou dans des archives ZIP)
- ✅ Extraction et transformation automatique des données (ETL)
- ✅ API REST pour accéder aux métriques et analyses
- ✅ Base de données Prisma (PostgreSQL)
- ✅ Agrégation intelligente des données par zone et période

### Dashboard (`dashboard.html`)
- 📊 Graphiques interactifs (évolution temporelle des KPI)
- 📈 Métriques clés : occurrences, passagers, durée moyenne
- 🔍 Recherche et filtrage par zone
- 📋 Tableau avec tri et pagination
- 🎨 Design moderne et responsive

### Interface de gestion (`cleaning-dashboard/`)
- 👥 Gestion des vacations
- 📅 Planification des tâches
- 🎯 Interface utilisateur moderne avec React + TypeScript

## 🛠️ Stack Technique

### Backend
- **NestJS** - Framework Node.js pour API robustes
- **Prisma** - ORM moderne pour TypeScript/Node.js
- **PostgreSQL** - Base de données relationnelle
- **XLSX** - Traitement de fichiers Excel
- **TypeScript** - Typage statique

### Frontend
- **React** - Bibliothèque UI
- **TypeScript** - Typage statique
- **Vite** - Build tool rapide
- **Chart.js** - (Dashboard) Visualisations de données

## 📦 Installation

### Prérequis
- Node.js (v18+)
- PostgreSQL
- npm ou yarn

### Backend

```bash
cd cleaning-saas-backend

# Installer les dépendances
npm install

# Configurer la base de données
cp .env.example .env
# Éditer .env avec vos identifiants PostgreSQL

# Générer le client Prisma
npm run prisma:generate

# Appliquer les migrations
npm run prisma:migrate

# Lancer le serveur de développement
npm run start:dev
```

Le backend sera accessible sur `http://localhost:3000`

### Frontend (Dashboard React)

```bash
cd cleaning-dashboard

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

### Dashboard HTML

Ouvrez simplement `dashboard.html` dans votre navigateur ou utilisez un serveur local.

## 📖 Documentation API

Une fois le backend lancé, consultez la documentation complète dans :
- [API.md](./cleaning-saas-backend/API.md)
- Endpoints principaux :
  - `POST /upload/excel` - Uploader un fichier Excel
  - `POST /upload/zip` - Uploader un ZIP contenant des Excel
  - `GET /metrics` - Récupérer les métriques agrégées
  - `GET /zones` - Lister toutes les zones

## 🗂️ Structure du Projet

```
.
├── cleaning-saas-backend/     # Backend NestJS + Prisma
│   ├── src/
│   │   ├── etl/              # Services de transformation de données
│   │   ├── metrics/          # API des métriques
│   │   ├── upload/           # Gestion des uploads
│   │   └── zones/            # API des zones
│   ├── prisma/               # Schéma de base de données
│   └── data/                 # Dossier pour fichiers uploadés
│
├── cleaning-dashboard/        # Application React frontend
│   ├── src/
│   │   ├── components/       # Composants React
│   │   ├── pages/            # Pages de l'application
│   │   └── lib/              # Utilitaires
│
├── dashboard.html            # Dashboard de visualisation standalone
├── upload.html              # Page d'upload standalone
└── README.md                # Ce fichier
```

## 🎯 Utilisation

1. **Démarrez le backend** : `cd cleaning-saas-backend && npm run start:dev`
2. **Uploadez vos données** : Ouvrez `upload.html` et uploadez un fichier ZIP contenant vos fichiers Excel
3. **Visualisez les résultats** : Ouvrez `dashboard.html` pour voir les analyses et graphiques

## 🤝 Contribution

Les contributions sont les bienvenues ! Consultez [COLLABORATION.md](./COLLABORATION.md) pour plus de détails.

## 📝 License

MIT

## 👨‍💻 Auteur

Développé avec ❤️ pour optimiser la gestion des opérations de nettoyage
