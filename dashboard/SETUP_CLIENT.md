# 🚀 Client-Side Setup & Installation

## Installation

```bash
# 1. Accéder au dossier dashboard
cd dashboard

# 2. Installer les dépendances
npm install

# 3. Démarrer le serveur de développement
npm run dev
```

L'application s'ouvrira sur **http://localhost:5173**

---

## 📂 Structure des Fichiers

```
dashboard/src/
├── context/
│   ├── AuthContext.jsx          # Gestion de l'authentification
│   └── CartContext.jsx          # Gestion du panier
├── pages/
│   ├── ProductListPage.jsx      # Liste des produits
│   ├── ProductDetailPage.jsx    # Détail d'un produit
│   ├── CartPage.jsx             # Panier
│   ├── CheckoutPage.jsx         # Paiement & confirmation
│   ├── OrdersHistoryPage.jsx    # Historique des commandes
│   └── OrderDetailPage.jsx      # Détail d'une commande
├── components/
│   └── ClientNavbar.jsx         # Barre de navigation
├── utils/
│   ├── api.js                   # Configuration Axios
│   └── apiClient.js             # Endpoints API
└── main.jsx                     # Point d'entrée
```

---

## 🔑 Fonctionnalités

### ✅ Implémentées
- [x] Listing des produits avec filtres
- [x] Détails des produits
- [x] Panier persistant (localStorage)
- [x] Gestion des adresses de livraison
- [x] Création de commandes
- [x] Historique des commandes
- [x] Suivi de commande en temps réel

### ⏳ À faire
- [ ] Authentification client (register/login)
- [ ] Paiement par carte (intégration Stripe)
- [ ] Notifications en temps réel (Socket.io)
- [ ] Évaluations produits
- [ ] Favoris/Wishlist
- [ ] Historique de recherche

---

## 🔗 Routes Disponibles

| Route | Description | Auth |
|-------|-------------|------|
| `/products` | Liste des produits | ✅ Publique |
| `/products/:id` | Détail d'un produit | ✅ Publique |
| `/cart` | Panier | ✅ Publique |
| `/checkout` | Paiement | ❌ Auth req. |
| `/orders` | Mes commandes | ❌ Auth req. |
| `/orders/:id` | Détail commande | ❌ Auth req. |
| `/login` | Connexion | ✅ Publique |

---

## 🔐 Variables d'Environnement

Créer un fichier `.env` à la racine du dossier `dashboard`:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

---

## 🛠️ Technologies

- **React 18** - UI Framework
- **React Router v6** - Navigation
- **TanStack React Query** - Gestion des données
- **Axios** - Requêtes HTTP
- **Bootstrap 5** - CSS Framework
- **React Hot Toast** - Notifications

---

## 🐛 Dépannage

### "API is not connected"
```bash
# 1. Vérifier que le backend tourne
cd backend
npm run dev

# 2. Vérifier le port (3000 par défaut)
# 3. Vérifier que .env pointe vers le bon backend
```

### "Produits non affichés"
1. Vérifier que la table `produits` contient des données
2. Ouvrir DevTools (F12) → Network
3. Chercher la requête GET `/api/products`
4. Vérifier la réponse

### "Panier vide après rechargement"
- localStorage peut être désactivé dans le navigateur
- Vérifier les cookies/stockage local en F12

---

## 📊 Flux d'Utilisation

1. **Utilisateur non connecté** → Peut voir produits et panier
2. **Ajouter au panier** → Sauvegardé dans localStorage
3. **Cliquer "Passer la commande"** → Redirection vers login
4. **Après login** → Accès au checkout
5. **Confirmation** → Création commande en BD
6. **Dashboard** → Voir historique et suivi

---

## 📱 Responsive Design

- ✅ Desktop (>1024px)
- ✅ Tablet (768px-1024px)
- ✅ Mobile (<768px)

Toutes les pages sont optimisées pour tous les appareils.

---

## 💡 Conseils de Développement

### Ajouter une nouvelle page
1. Créer le fichier dans `src/pages/MaPage.jsx`
2. L'importer dans `App.jsx`
3. Ajouter la route dans le `<Routes>`

### Ajouter un nouvel endpoint API
1. Ajouter la fonction dans `src/utils/apiClient.js`
2. L'utiliser avec `useQuery` ou `useMutation`

### Modifier le cart
```javascript
import { useCart } from '../context/CartContext'

const { items, addItem, removeItem } = useCart()
```

### Faire une requête API
```javascript
import { productsAPI } from '../utils/apiClient'

const { data } = useQuery({
  queryKey: ['products'],
  queryFn: () => productsAPI.getAll()
})
```

---

## 📞 Support & Questions

Pour debuguer, vérifier toujours:
1. Console du navigateur (F12)
2. Tab Network pour les requêtes API
3. Local Storage (F12 → Application)
4. Logs du backend (terminal Node)

---

**Version**: 1.0
**Dernière mise à jour**: Février 2026
**Status**: Production Ready
