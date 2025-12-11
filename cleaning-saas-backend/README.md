# Cleaning SaaS Backend

Backend Node.js/TypeScript pour l'ingestion et l'analyse de données de planification de nettoyage à partir de fichiers Excel.

## 📋 Table des Matières

- [Fonctionnalités](#fonctionnalités)
- [Stack Technique](#stack-technique)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Configuration](#configuration)
- [Utilisation](#utilisation)
  - [Lancer l'API](#lancer-lapi)
  - [Ingérer un fichier Excel](#ingérer-un-fichier-excel)
- [API Endpoints](#api-endpoints)
- [Architecture](#architecture)
- [Développement](#développement)
- [Tests](#tests)

## ✨ Fonctionnalités

- **Ingestion de fichiers Excel** : Parsing automatique de fichiers Excel quotidiens avec extraction de données multi-onglets
- **Agrégation de KPI** : Calcul et agrégation de métriques de nettoyage par zone et par date
- **API REST** : Exposition de métriques via une API HTTP bien structurée
- **Validation robuste** : Validation des données d'entrée avec class-validator
- **Base de données PostgreSQL** : Stockage optimisé avec Prisma ORM
- **Architecture modulaire** : Séparation claire des responsabilités (ETL, API, Database)

## 🛠 Stack Technique

- **Framework** : NestJS 10
- **Langage** : TypeScript 5
- **Base de données** : PostgreSQL 15
- **ORM** : Prisma 5
- **Parsing Excel** : xlsx
- **Validation** : class-validator
- **Tests** : Jest

## 📦 Prérequis

- Node.js >= 18.x
- PostgreSQL >= 15.x (ou Docker pour utiliser le docker-compose fourni)
- npm ou yarn

## 🚀 Installation

1. **Cloner le projet**
```bash
cd cleaning-saas-backend
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer l'environnement**

Copier le fichier `.env.example` vers `.env` et ajuster les variables :
```bash
cp .env.example .env
```

Éditer `.env` :
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/cleaning_saas?schema=public"
PORT=3000
NODE_ENV=development
EXCEL_INPUT_DIR=./data/input
```

4. **Lancer PostgreSQL avec Docker (optionnel)**
```bash
docker-compose up -d
```

5. **Générer le client Prisma et créer la base**
```bash
npm run prisma:generate
npm run prisma:migrate
```

## ⚙️ Configuration

### Variables d'environnement

| Variable | Description | Défaut |
|----------|-------------|--------|
| `DATABASE_URL` | URL de connexion PostgreSQL | `postgresql://postgres:postgres@localhost:5432/cleaning_saas` |
| `PORT` | Port du serveur HTTP | `3000` |
| `NODE_ENV` | Environnement (development/production) | `development` |
| `EXCEL_INPUT_DIR` | Dossier pour les fichiers Excel | `./data/input` |

## 🎯 Utilisation

### Lancer l'API

**Mode développement (avec rechargement automatique) :**
```bash
npm run start:dev
```

**Mode production :**
```bash
npm run build
npm run start:prod
```

L'API sera accessible sur `http://localhost:3000`

### Ingérer un fichier Excel

Placer votre fichier Excel dans `./data/input/` puis exécuter :

```bash
npm run ingest -- ./data/input/Standard.xlsx
```

Ou avec un chemin absolu :
```bash
npm run ingest -- "C:\path\to\your\file.xlsx"
```

**Exemple de sortie :**
```
🚀 Starting ETL process for: ./data/input/Standard.xlsx

📖 Reading Excel file...
   Found 88 sheets

📊 Parsing sheets...
   Date: 2025-12-03
✅ Parsed 121 zones
✅ Parsed 121 zone KPIs
✅ Parsed 38 zone demand category KPIs
✅ Parsed 0 zones with PAX data

🔄 Aggregating data...
✅ Aggregated 121 zone metrics

💾 Inserting into database...

✅ ETL process completed successfully!
   Inserted/Updated: 121 records
```

## 📡 API Endpoints

### GET /metrics?date=YYYY-MM-DD

Récupère toutes les métriques pour une date donnée.

**Exemple :**
```bash
curl "http://localhost:3000/metrics?date=2025-12-03"
```

**Réponse :**
```json
{
  "date": "2025-12-03",
  "count": 121,
  "data": [
    {
      "id": 1,
      "date": "2025-12-03T00:00:00.000Z",
      "zoneId": "ADP / CDG / 2F / Arrivée / Canyon F1 / Zone Publique Canyon F1 / BS Canyon F1 / BS Femmes Canyon F1",
      "zoneName": "BS Femmes Canyon F1",
      "occurrencesMaintenance": 4,
      "occurrencesAdditionnelles": 1,
      "paxTotal": 0,
      "dureeMaintenanceSeconds": 1800,
      "dureeAdditionnelleSeconds": 600,
      "createdAt": "2025-12-04T10:00:00.000Z",
      "updatedAt": "2025-12-04T10:00:00.000Z"
    }
  ]
}
```

### GET /metrics/:zoneId?date=YYYY-MM-DD

Récupère les métriques pour une zone spécifique, optionnellement filtrées par date.

**Exemple :**
```bash
curl "http://localhost:3000/metrics/ADP%20%2F%20CDG%20%2F%202F%20%2F%20Arrivée?date=2025-12-03"
```

### GET /metrics/dates/available

Liste toutes les dates pour lesquelles des données sont disponibles.

**Exemple :**
```bash
curl "http://localhost:3000/metrics/dates/available"
```

**Réponse :**
```json
{
  "count": 1,
  "dates": ["2025-12-03"]
}
```

### GET /metrics/stats/summary?date=YYYY-MM-DD

Récupère les statistiques agrégées pour une date.

**Exemple :**
```bash
curl "http://localhost:3000/metrics/stats/summary?date=2025-12-03"
```

**Réponse :**
```json
{
  "date": "2025-12-03T00:00:00.000Z",
  "totalZones": 121,
  "totalPax": 0,
  "totalMaintenanceHours": 250.5,
  "totalAdditionnelleHours": 45.2,
  "totalOccurrencesMaintenance": 484,
  "totalOccurrencesAdditionnelles": 121
}
```

## 🏗 Architecture

```
src/
├── common/                 # Utilitaires partagés
│   └── utils/
│       ├── time.utils.ts           # Conversion HH:MM:SS <-> secondes
│       └── text-parser.utils.ts    # Parsing de visitBoundsExplanation
├── database/               # Couche base de données
│   ├── database.module.ts
│   └── prisma.service.ts           # Service Prisma avec lifecycle
├── etl/                    # Couche ETL (Extract, Transform, Load)
│   ├── services/
│   │   ├── excel-parser.service.ts        # Parser Excel générique
│   │   ├── data-aggregator.service.ts     # Agrégation des données
│   │   ├── etl-orchestrator.service.ts    # Orchestrateur ETL principal
│   │   └── parsing/                        # Parsers spécifiques par sheet
│   │       ├── global-parameter.parser.ts
│   │       ├── zone.parser.ts
│   │       ├── zone-kpi.parser.ts
│   │       ├── zone-demand-category-kpi.parser.ts
│   │       └── crowd-information.parser.ts
│   └── etl.module.ts
├── metrics/                # Couche API
│   ├── dto/
│   │   └── query-metrics.dto.ts    # DTOs de validation
│   ├── metrics.controller.ts       # Contrôleur REST
│   ├── metrics.service.ts          # Logique métier
│   └── metrics.module.ts
├── app.module.ts           # Module racine
└── main.ts                 # Point d'entrée

prisma/
└── schema.prisma           # Schéma de base de données

scripts/
└── ingest.ts               # Script d'ingestion CLI
```

## 👨‍💻 Développement

### Lancer en mode développement

```bash
npm run start:dev
```

### Formatage du code

```bash
npm run format
```

### Linting

```bash
npm run lint
```

### Prisma Studio (UI base de données)

```bash
npm run prisma:studio
```

## 🧪 Tests

### Lancer tous les tests

```bash
npm test
```

### Tests avec couverture

```bash
npm run test:cov
```

### Tests en mode watch

```bash
npm run test:watch
```

### Tests E2E

```bash
npm run test:e2e
```

## 📊 Modèle de Données

### Table: `daily_zone_cleaning_metrics`

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | INT | Clé primaire auto-incrémentée |
| `date` | DATE | Date du scénario |
| `zoneId` | VARCHAR(500) | Identifiant de la zone |
| `zoneName` | VARCHAR(200) | Nom lisible de la zone |
| `occurrencesMaintenance` | INT | Nombre d'occurrences de maintenance |
| `occurrencesAdditionnelles` | INT | Nombre d'occurrences de renfort |
| `paxTotal` | INT | Total de passagers sur la journée |
| `dureeMaintenanceSeconds` | INT | Durée ENTRETIEN en secondes |
| `dureeAdditionnelleSeconds` | INT | Durée RENFORT en secondes |
| `createdAt` | TIMESTAMP | Date de création |
| `updatedAt` | TIMESTAMP | Date de mise à jour |

**Index :**
- Unique : `(date, zoneId)`
- Index : `date`
- Index : `zoneId`

## 🔍 Dépannage

### Erreur de connexion à la base de données

Vérifier que PostgreSQL est démarré :
```bash
docker-compose ps
```

Tester la connexion :
```bash
psql postgresql://postgres:postgres@localhost:5432/cleaning_saas
```

### Erreur "Sheet not found"

Vérifier que votre fichier Excel contient les onglets requis :
- GlobalParameter
- Zone
- ZoneKpi
- ZoneDemandCategoryKpi
- CrowdInformation

### Réinitialiser la base de données

```bash
npx prisma migrate reset
npm run prisma:migrate
```

## 📝 License

MIT

## 👥 Auteurs

Développé pour Atalian
