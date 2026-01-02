# 🐳 Guide Docker Desktop - Solution Simple

## Vous avez Docker installé ! C'est la solution la plus simple.

### Étape 1 : Démarrer Docker Desktop

1. **Ouvrez le menu Démarrer** de Windows
2. Cherchez **"Docker Desktop"**
3. **Cliquez** pour le lancer
4. **Attendez** que l'icône Docker dans la barre des tâches (en bas à droite) devienne **verte**
   - ⏱️ Cela peut prendre 1-2 minutes au premier démarrage

### Étape 2 : Vérifier que Docker fonctionne

Ouvrez PowerShell et tapez :
```powershell
docker --version
```

Vous devriez voir :
```
Docker version 28.3.2, build 578ccf6
```

### Étape 3 : Lancer PostgreSQL avec Docker Compose

Dans le dossier du projet :
```powershell
cd "C:\Users\zined\Downloads\Data model Atalian\cleaning-saas-backend"
docker-compose up -d
```

Vous devriez voir :
```
Creating network "cleaning-saas-backend_default" with the default driver
Creating volume "cleaning-saas-backend_postgres_data" with default driver
Creating cleaning_saas_db ... done
```

### Étape 4 : Vérifier que PostgreSQL tourne

```powershell
docker-compose ps
```

Vous devriez voir :
```
       Name                     Command              State           Ports
--------------------------------------------------------------------------------
cleaning_saas_db   docker-entrypoint.sh postgres   Up      0.0.0.0:5432->5432/tcp
```

### Étape 5 : Configurer le .env

Le fichier `.env` est déjà configuré avec les bonnes valeurs pour Docker :

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/cleaning_saas?schema=public"
PORT=3000
NODE_ENV=development
EXCEL_INPUT_DIR=./data/input
```

**Mot de passe** : `postgres` (défini dans docker-compose.yml)

### Étape 6 : Initialiser la base de données

```powershell
npm run prisma:migrate
```

Vous devriez voir :
```
✔ Generated Prisma Client
Your database is now in sync with your schema.
```

### Étape 7 : Lancer l'application

```powershell
npm run start:dev
```

Vous devriez voir :
```
✅ Database connected
✅ Application is running on: http://localhost:3000
```

### Étape 8 : Ingérer les données

```powershell
npm run ingest -- ./data/input/Standard.xlsx
```

---

## Commandes Docker Utiles

### Démarrer PostgreSQL
```powershell
docker-compose up -d
```

### Arrêter PostgreSQL
```powershell
docker-compose down
```

### Voir les logs PostgreSQL
```powershell
docker-compose logs -f postgres
```

### Redémarrer PostgreSQL
```powershell
docker-compose restart
```

### Supprimer tout (base de données incluse)
```powershell
docker-compose down -v
```

### Se connecter à PostgreSQL
```powershell
docker exec -it cleaning_saas_db psql -U postgres -d cleaning_saas
```

---

## Dépannage

### Docker Desktop ne démarre pas

**Erreur** : "Docker Desktop starting..."
**Solution** : 
1. Redémarrez votre ordinateur
2. Relancez Docker Desktop
3. Si ça persiste, désinstallez et réinstallez Docker Desktop

### Port 5432 déjà utilisé

**Erreur** : `Bind for 0.0.0.0:5432 failed: port is already allocated`
**Solution** : Vous avez PostgreSQL installé localement qui utilise le port 5432

**Option A** : Arrêter PostgreSQL local
```powershell
Stop-Service postgresql-x64-17
docker-compose up -d
```

**Option B** : Changer le port Docker
Éditez `docker-compose.yml` :
```yaml
ports:
  - "5433:5432"  # Utiliser le port 5433 au lieu de 5432
```

Puis mettez à jour `.env` :
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/cleaning_saas?schema=public"
```

### "no configuration file provided"

**Erreur** : Vous n'êtes pas dans le bon dossier
**Solution** :
```powershell
cd "C:\Users\zined\Downloads\Data model Atalian\cleaning-saas-backend"
docker-compose up -d
```

---

## Avantages de Docker

✅ **Pas besoin de mot de passe** - Tout est configuré automatiquement
✅ **Isolation** - N'interfère pas avec d'autres installations PostgreSQL
✅ **Facile à supprimer** - Un simple `docker-compose down -v`
✅ **Portable** - Fonctionne pareil sur tous les ordinateurs
✅ **Pas de configuration** - Tout est dans docker-compose.yml

---

## Résumé : 3 Commandes Seulement !

```powershell
# 1. Lancer Docker Desktop (via le menu Démarrer)

# 2. Démarrer PostgreSQL
docker-compose up -d

# 3. Initialiser la base
npm run prisma:migrate

# 4. Lancer l'app
npm run start:dev

# 5. Ingérer les données
npm run ingest -- ./data/input/Standard.xlsx
```

**C'est tout ! 🎉**
