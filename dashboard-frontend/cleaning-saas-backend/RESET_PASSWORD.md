# 🔑 Réinitialiser le Mot de Passe PostgreSQL sur Windows

## Vous avez oublié votre mot de passe PostgreSQL ? Voici comment le réinitialiser.

---

## Méthode 1 : Modification Temporaire de l'Authentification

### Étape 1 : Localiser le fichier pg_hba.conf

Ouvrez l'Explorateur Windows et allez à :
- `C:\Program Files\PostgreSQL\15\data\pg_hba.conf`
- OU `C:\Program Files\PostgreSQL\16\data\pg_hba.conf`

**Astuce** : Cherchez "PostgreSQL" dans `C:\Program Files\` pour trouver votre version.

### Étape 2 : Modifier pg_hba.conf

1. **Ouvrez le fichier en tant qu'Administrateur** :
   - Clic droit sur `pg_hba.conf` → "Ouvrir avec" → "Bloc-notes"
   - Si demandé, acceptez les privilèges administrateur

2. **Trouvez ces lignes** (vers la fin du fichier) :
   ```
   # IPv4 local connections:
   host    all             all             127.0.0.1/32            scram-sha-256
   ```

3. **Remplacez `scram-sha-256` par `trust`** :
   ```
   # IPv4 local connections:
   host    all             all             127.0.0.1/32            trust
   ```

4. **Sauvegardez** le fichier (Ctrl+S)

### Étape 3 : Redémarrer PostgreSQL

**Option A : Via Services Windows**
1. Appuyez sur `Win + R`
2. Tapez `services.msc` et appuyez sur Entrée
3. Trouvez `postgresql-x64-15` (ou 16)
4. Clic droit → "Redémarrer"

**Option B : Via PowerShell (en tant qu'Administrateur)**
```powershell
Restart-Service postgresql-x64-15
# OU
Restart-Service postgresql-x64-16
```

### Étape 4 : Réinitialiser le mot de passe

1. **Ouvrez PowerShell**
2. **Connectez-vous à PostgreSQL** (sans mot de passe grâce à "trust") :
   ```powershell
   psql -U postgres
   ```

3. **Changez le mot de passe** :
   ```sql
   ALTER USER postgres WITH PASSWORD 'nouveau_mot_de_passe';
   ```
   
   **Exemple** :
   ```sql
   ALTER USER postgres WITH PASSWORD 'postgres';
   ```

4. **Quittez psql** :
   ```sql
   \q
   ```

### Étape 5 : Remettre la sécurité

1. **Rouvrez `pg_hba.conf`** (en tant qu'Administrateur)

2. **Remettez `scram-sha-256`** :
   ```
   # IPv4 local connections:
   host    all             all             127.0.0.1/32            scram-sha-256
   ```

3. **Sauvegardez** (Ctrl+S)

4. **Redémarrez PostgreSQL** à nouveau (voir Étape 3)

---

## Méthode 2 : Réinstallation Rapide (Si Méthode 1 échoue)

### Option Simple : Désinstaller et Réinstaller

1. **Désinstaller PostgreSQL** :
   - Panneau de configuration → Programmes → Désinstaller PostgreSQL
   - ⚠️ **ATTENTION** : Cela supprimera toutes vos bases de données !

2. **Réinstaller** :
   - Téléchargez depuis https://www.postgresql.org/download/windows/
   - Choisissez un nouveau mot de passe simple (ex: `postgres`)

---

## Méthode 3 : Utiliser un Mot de Passe Simple pour le Développement

Si vous voulez éviter ces problèmes à l'avenir :

1. **Utilisez un mot de passe simple** : `postgres`
2. **Notez-le** dans un fichier texte sur votre bureau
3. **Pour la production**, utilisez un mot de passe fort

---

## Après Réinitialisation : Configurer le Projet

Une fois que vous avez votre nouveau mot de passe :

### 1. Créer la base de données

```powershell
psql -U postgres
```

Puis dans psql :
```sql
CREATE DATABASE cleaning_saas;
\q
```

### 2. Mettre à jour .env

Éditez `cleaning-saas-backend\.env` :

```env
DATABASE_URL="postgresql://postgres:VOTRE_NOUVEAU_MOT_DE_PASSE@localhost:5432/cleaning_saas?schema=public"
```

**Exemple** :
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/cleaning_saas?schema=public"
```

### 3. Initialiser la base

```powershell
cd "C:\Users\zined\Downloads\Data model Atalian\cleaning-saas-backend"
npm run prisma:migrate
```

### 4. Tester la connexion

```powershell
npm run start:dev
```

Si vous voyez `✅ Database connected`, c'est bon ! 🎉

---

## Dépannage

### "psql n'est pas reconnu comme commande"

Ajoutez PostgreSQL au PATH :
1. Cherchez "Variables d'environnement" dans Windows
2. Variables système → Path → Modifier
3. Ajoutez : `C:\Program Files\PostgreSQL\15\bin`
4. Redémarrez PowerShell

### "Accès refusé" lors de la modification de pg_hba.conf

Ouvrez le Bloc-notes **en tant qu'Administrateur** :
1. Cherchez "Bloc-notes" dans le menu Démarrer
2. Clic droit → "Exécuter en tant qu'administrateur"
3. Fichier → Ouvrir → Naviguez vers pg_hba.conf

### Le service PostgreSQL ne redémarre pas

```powershell
# Arrêter
Stop-Service postgresql-x64-15

# Attendre 5 secondes

# Démarrer
Start-Service postgresql-x64-15
```

---

## Résumé Rapide

```powershell
# 1. Modifier pg_hba.conf : scram-sha-256 → trust
# 2. Redémarrer PostgreSQL
Restart-Service postgresql-x64-15

# 3. Changer le mot de passe
psql -U postgres
ALTER USER postgres WITH PASSWORD 'postgres';
\q

# 4. Remettre pg_hba.conf : trust → scram-sha-256
# 5. Redémarrer PostgreSQL
Restart-Service postgresql-x64-15

# 6. Créer la base
psql -U postgres
CREATE DATABASE cleaning_saas;
\q

# 7. Mettre à jour .env avec le nouveau mot de passe
# 8. Lancer les migrations
npm run prisma:migrate
```

---

**Besoin d'aide ?** Suivez le guide étape par étape ci-dessus ! 🚀
