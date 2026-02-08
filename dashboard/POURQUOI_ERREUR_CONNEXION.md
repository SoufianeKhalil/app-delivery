# Pourquoi "Erreur de connexion" ?

Le **dashboard** (React sur http://localhost:3001) envoie les requêtes de login vers le **backend Node.js** sur http://localhost:3000.

Si le backend Node.js **n'est pas démarré**, la requête échoue → tu vois "Erreur de connexion".

---

## Solution : Démarrer le backend Node.js

### 1. Ouvre un nouveau terminal PowerShell

### 2. Va dans le dossier backend et installe les dépendances (une seule fois)

```powershell
cd "c:\Application de livrison local\backend"
npm install
```

### 3. Crée un fichier `.env` dans le dossier `backend`

Copie le contenu suivant et adapte le mot de passe MySQL si besoin :

```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=delivery_app
JWT_SECRET=cle_secrete_jwt_123
```

### 4. Démarre le backend

```powershell
node server.js
```

ou

```powershell
npm run dev
```

Tu dois voir quelque chose comme : `Server running on port 3000`

### 5. Garde ce terminal ouvert, puis dans un autre terminal démarre le dashboard

```powershell
cd "c:\Application de livrison local\dashboard"
npm run dev
```

### 6. Connecte-toi sur le dashboard

Ouvre http://localhost:3001 et connecte-toi avec :
- Email : `admin@delivery.com`
- Mot de passe : `admin123`

**Important :** L’utilisateur admin doit exister dans la base **MySQL** utilisée par le backend Node (table `utilisateurs`). Si tu as créé l’admin seulement avec Laravel (AdminSeeder), il faut soit créer le même utilisateur dans la base pour Node, soit utiliser un utilisateur déjà présent dans la table `utilisateurs`.

---

## Résumé

| Service        | Port | Commande              |
|----------------|------|------------------------|
| Backend Node.js| 3000 | `cd backend` puis `node server.js` |
| Dashboard React| 3001 | `cd dashboard` puis `npm run dev`  |

Les deux doivent tourner en même temps pour que le login fonctionne.
