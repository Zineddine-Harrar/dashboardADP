# 🪟 Guide de Configuration Windows (Sans Docker)

## Problème : Docker Desktop ne démarre pas

Si vous avez l'erreur `The system cannot find the file specified` avec Docker, voici comment configurer PostgreSQL directement sur Windows.

## Étape 1 : Installer PostgreSQL

### Téléchargement
1. Allez sur https://www.postgresql.org/download/windows/
2. Cliquez sur "Download the installer"
3. Téléchargez PostgreSQL 15 ou 16 (version Windows x86-64)

### Installation
1. Lancez l'installeur
2. **Port** : Laissez `5432` (par défaut)
3. **Mot de passe** : Choisissez un mot de passe simple pour le développement (ex: `postgres`)
4. **Locale** : Laissez par défaut
5. Terminez l'installation

## Étape 2 : Créer la base de données

### Option A : Avec pgAdmin (Interface graphique)
1. Ouvrez **pgAdmin 4** (installé avec PostgreSQL)
2. Connectez-vous avec le mot de passe choisi
3. Clic droit sur "Databases" → "Create" → "Database"
4. Nom : `cleaning_saas`
5. Cliquez "Save"

### Option B : Avec SQL Shell (psql)
1. Cherchez "SQL Shell (psql)" dans le menu Démarrer
2. Appuyez sur Entrée pour tous les paramètres par défaut
3. Entrez votre mot de passe
4. Tapez :
   ```sql
   CREATE DATABASE cleaning_saas;
   \q
   ```

## Étape 3 : Configurer le fichier .env

Le fichier `.env` a déjà été créé. Vous devez juste mettre à jour le mot de passe :

**Ouvrez** : `cleaning-saas-backend\.env`

**Modifiez la ligne DATABASE_URL** :
```env
DATABASE_URL="postgresql://postgres:VOTRE_MOT_DE_PASSE@localhost:5432/cleaning_saas?schema=public"
```

Remplacez `VOTRE_MOT_DE_PASSE` par le mot de passe que vous avez choisi lors de l'installation.

**Exemple** :
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/cleaning_saas?schema=public"
PORT=3000
NODE_ENV=development
EXCEL_INPUT_DIR=./data/input
```

## Étape 4 : Initialiser la base de données

Dans le terminal (dans le dossier `cleaning-saas-backend`) :

```powershell
# Générer le client Prisma
npm run prisma:generate

# Créer les tables
npm run prisma:migrate
```

Si tout fonctionne, vous verrez :
```
✔ Generated Prisma Client
...
Your database is now in sync with your schema.
```

## Étape 5 : Lancer l'application

```powershell
npm run start:dev
```

Vous devriez voir :
```
✅ Database connected
✅ Application is running on: http://localhost:3000
```

## Étape 6 : Ingérer le fichier Excel

Le fichier `Standard.xlsx` est déjà dans le bon dossier !

```powershell
npm run ingest -- ./data/input/Standard.xlsx
```

## Vérification

Testez l'API :
```powershell
# Dates disponibles
curl "http://localhost:3000/metrics/dates/available"

# Métriques du jour
curl "http://localhost:3000/metrics?date=2025-12-03"
```

## Dépannage

### Erreur "Environment variable not found: DATABASE_URL"
→ Le fichier `.env` n'existe pas ou est mal placé
→ Solution : Vérifiez qu'il est dans `cleaning-saas-backend\.env`

### Erreur de connexion PostgreSQL
→ PostgreSQL n'est pas démarré
→ Solution : Cherchez "Services" dans Windows, trouvez "postgresql-x64-15" et démarrez-le

### Port 5432 déjà utilisé
→ Une autre instance PostgreSQL tourne
→ Solution : Changez le port dans `.env` ou arrêtez l'autre instance

### Erreur "relation does not exist"
→ Les tables ne sont pas créées
→ Solution : Relancez `npm run prisma:migrate`

## Commandes utiles PostgreSQL

```powershell
# Vérifier si PostgreSQL tourne
Get-Service postgresql*

# Démarrer PostgreSQL
Start-Service postgresql-x64-15

# Arrêter PostgreSQL
Stop-Service postgresql-x64-15

# Se connecter à la base
psql -U postgres -d cleaning_saas
```

## Prochaines étapes

Une fois que tout fonctionne :
1. ✅ L'API tourne sur http://localhost:3000
2. ✅ Les données sont ingérées
3. ✅ Vous pouvez interroger l'API

Consultez [README.md](README.md) pour plus de détails sur l'utilisation !
