# 🤝 Guide de Collaboration

Ce fichier explique comment partager ce projet sur GitHub et travailler avec un autre développeur.

## 1. Mettre le projet sur GitHub (Pour toi)

J'ai déjà initialisé Git localement et créé le premier commit. Voici ce qu'il te reste à faire :

1.  Connecte-toi à ton compte **GitHub**.
2.  Crée un **Nouveau Repository** (bouton "+" en haut à droite -> "New repository").
    *   Nomme-le (ex: `atalian-dashboard`).
    *   Laisse-le en **Public** ou **Private** (selon ton choix).
    *   **NE COCHE PAS** "Initialize with README", "Add .gitignore", ou "Add license" (on a déjà tout ça).
3.  Une fois créé, GitHub te montrera des commandes. Copie et exécute les commandes de la section **"…or push an existing repository from the command line"** dans ton terminal ici :

```bash
git remote add origin https://github.com/TON_NOM_UTILISATEUR/NOM_DU_REPO.git
git branch -M main
git push -u origin main
```

*(Remplace `TON_NOM_UTILISATEUR` et `NOM_DU_REPO` par les vraies valeurs)*

## 2. Pour ton ami (Le collaborateur)

Ton ami devra faire ceci pour récupérer le projet :

1.  **Cloner le projet** :
    ```bash
    git clone https://github.com/TON_NOM_UTILISATEUR/NOM_DU_REPO.git
    cd NOM_DU_REPO
    ```

2.  **Installer les dépendances** :
    Il y a deux parties à installer (Backend et Frontend).
    
    *Backend :*
    ```bash
    cd cleaning-saas-backend
    npm install
    ```

    *Frontend (Dashboard) :*
    ```bash
    cd ../cleaning-dashboard
    npm install
    ```

3.  **Lancer avec Antigravity** :
    *   Il peut ouvrir le dossier du projet dans son éditeur (VS Code / Cursor).
    *   Antigravity détectera automatiquement le code.
    *   Pour lancer le projet, il peut utiliser les commandes habituelles (`npm run start:dev` dans le backend, etc.).

## 3. Travailler ensemble avec Antigravity

Puisque vous utilisez tous les deux Antigravity :

*   **Git est votre ami** : Faites des commits réguliers.
*   **Antigravity lit le code** : Quand ton ami ouvrira le projet, son Antigravity lira les fichiers existants et comprendra le contexte immédiatement.
*   **Ne partagez pas le dossier `.gemini`** : J'ai configuré le fichier `.gitignore` pour ignorer le dossier `.gemini`. C'est important car ce dossier contient votre historique de conversation personnel avec l'IA, qui ne doit pas être partagé. Chacun aura sa propre "mémoire" locale avec son IA.

## Commandes Utiles

*   `git status` : Voir les fichiers modifiés.
*   `git add .` : Ajouter les modifications.
*   `git commit -m "Message"` : Sauvegarder les modifications.
*   `git push` : Envoyer sur GitHub.
*   `git pull` : Récupérer les modifications de l'autre.
