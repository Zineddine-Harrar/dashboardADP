# 🚀 Quick Start Guide

Guide de démarrage rapide pour le SaaS Backend de nettoyage.

## Installation en 5 minutes

### 1. Prérequis

- Node.js 18+ installé
- PostgreSQL 15+ (ou Docker)

### 2. Installation

```bash
# Cloner ou naviguer vers le projet
cd cleaning-saas-backend

# Installer les dépendances
npm install

# Copier la configuration
cp .env.example .env
```

### 3. Base de données

#### Option A: Avec Docker (recommandé)

```bash
# Démarrer PostgreSQL
docker-compose up -d

# Vérifier que PostgreSQL est démarré
docker-compose ps
```

#### Option B: PostgreSQL existant

Éditez `.env` avec vos paramètres PostgreSQL :
```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/cleaning_saas?schema=public"
```

### 4. Initialiser la base

```bash
# Générer le client Prisma
npm run prisma:generate

# Créer les tables
npm run prisma:migrate
```

### 5. Lancer l'application

```bash
# Mode développement
npm run start:dev
```

L'API est maintenant accessible sur `http://localhost:3000` 🎉

## Premier test : Ingérer un fichier

### 1. Placer un fichier Excel

Copiez votre fichier Excel dans `./data/input/` :
```bash
# Exemple avec Standard.xlsx
cp "C:\path\to\Standard.xlsx" ./data/input/
```

### 2. Lancer l'ingestion

```bash
npm run ingest -- ./data/input/Standard.xlsx
```

Vous devriez voir :
```
🚀 Starting ETL process for: ./data/input/Standard.xlsx
...
✅ ETL process completed successfully!
   Inserted/Updated: 121 records
```

### 3. Tester l'API

```bash
# Récupérer les dates disponibles
curl "http://localhost:3000/metrics/dates/available"

# Récupérer les métriques pour une date
curl "http://localhost:3000/metrics?date=2025-12-03"

# Statistiques du jour
curl "http://localhost:3000/metrics/stats/summary?date=2025-12-03"
```

## Commandes utiles

```bash
# Développement
npm run start:dev          # Lancer en mode dev avec rechargement auto
npm run prisma:studio      # Ouvrir l'interface de la base de données

# Tests
npm test                   # Lancer tous les tests
npm run test:cov           # Tests avec couverture

# Production
npm run build              # Compiler le projet
npm run start:prod         # Lancer en production

# Base de données
npm run prisma:generate    # Générer le client Prisma
npm run prisma:migrate     # Créer/appliquer les migrations
npx prisma migrate reset   # Réinitialiser la base (⚠️ efface toutes les données)
```

## Prochaines étapes

1. **Lire la documentation** : Consultez [README.md](README.md) pour plus de détails
2. **Explorer l'API** : Voir [API.md](API.md) pour les endpoints détaillés
3. **Intégrer dans votre frontend** : Utilisez les exemples d'appels API fournis
4. **Automatiser l'ingestion** : Créez un cron job pour ingérer automatiquement les fichiers quotidiens

## Dépannage rapide

### Port déjà utilisé

Changez le port dans `.env` :
```env
PORT=3001
```

### Erreur de connexion base de données

Vérifiez que PostgreSQL est démarré :
```bash
docker-compose ps
# ou
psql --version
```

### Prisma Client non généré

Exécutez :
```bash
npm run prisma:generate
```

### Migration en erreur

Réinitialisez la base :
```bash
npx prisma migrate reset
npm run prisma:migrate
```

## Support

Pour toute question, consultez :
- [README.md](README.md) - Documentation complète
- [API.md](API.md) - Documentation API
- Logs de l'application pour diagnostics détaillés
