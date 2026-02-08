-- ============================================
-- DATABASE VERIFICATION & SETUP SCRIPT
-- Delivery & Ordering System
-- ============================================

-- ============================================
-- 1. VERIFY EXISTING TABLES
-- ============================================

-- Check utilisateurs table
DESC utilisateurs;
-- Should have: id, nom, email, password, role, created_at

-- Check produits table
DESC produits;
-- Should have: id, nom, description, prix, quantite, categorie_id, commercant_id, image, created_at

-- Check categories table
DESC categories;
-- Should have: id, nom, description

-- Check commandes table (main orders table)
DESC commandes;
-- Should have: id, utilisateur_id, montant_total, statut, adresse_livraison, adresse_detail, telephone, methode_paiement, notes, created_at, updated_at

-- Check commande_articles table (order items)
DESC commande_articles;
-- Should have: id, commande_id, produit_id, quantite, prix, created_at

-- ============================================
-- 2. CREATE MISSING TABLES
-- ============================================

-- Create utilisateur_adresses table (User addresses - NEW)
CREATE TABLE IF NOT EXISTS utilisateur_adresses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  utilisateur_id INT NOT NULL,
  adresse VARCHAR(500) NOT NULL,
  details VARCHAR(500),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
  INDEX idx_utilisateur_id (utilisateur_id),
  INDEX idx_is_default (is_default)
);

-- ============================================
-- 3. VERIFY/FIX COMMANDES TABLE
-- ============================================

-- Check if commandes table exists, if not create it
CREATE TABLE IF NOT EXISTS commandes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  utilisateur_id INT NOT NULL,
  montant_total DECIMAL(10, 2) NOT NULL,
  statut ENUM('pending', 'confirmed', 'preparing', 'ready', 'delivering', 'delivered', 'cancelled') DEFAULT 'pending',
  adresse_livraison VARCHAR(500) NOT NULL,
  adresse_detail VARCHAR(500),
  telephone VARCHAR(20),
  methode_paiement ENUM('cash', 'carte', 'wallet') DEFAULT 'cash',
  notes TEXT,
  nombre_articles INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id),
  INDEX idx_utilisateur_id (utilisateur_id),
  INDEX idx_statut (statut),
  INDEX idx_created_at (created_at)
);

-- Check if commande_articles table exists, if not create it
CREATE TABLE IF NOT EXISTS commande_articles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  commande_id INT NOT NULL,
  produit_id INT NOT NULL,
  quantite INT NOT NULL,
  prix DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (commande_id) REFERENCES commandes(id) ON DELETE CASCADE,
  FOREIGN KEY (produit_id) REFERENCES produits(id),
  INDEX idx_commande_id (commande_id),
  INDEX idx_produit_id (produit_id)
);

-- ============================================
-- 4. INSERT TEST DATA
-- ============================================

-- Insert test products if table is empty
INSERT IGNORE INTO produits (id, nom, description, prix, quantite, categorie_id, commercant_id, image, created_at)
SELECT 1, 'Tomate Fraîche', 'Tomates rouges fraîches du marché', 2.5, 100, 1, 1, '/images/tomate.jpg', NOW()
UNION ALL
SELECT 2, 'Lait Frais', 'Lait frais entier 1L', 3.0, 50, 4, 1, '/images/lait.jpg', NOW()
UNION ALL
SELECT 3, 'Pommes', 'Pommes rouges sucrées', 1.5, 80, 1, 2, '/images/pommes.jpg', NOW()
UNION ALL
SELECT 4, 'Poulet Fermier', 'Poulet fermier élevé à l\'air libre 1.5kg', 15.0, 20, 3, 2, '/images/poulet.jpg', NOW()
UNION ALL
SELECT 5, 'Pain Complet', 'Pain complet artisanal 500g', 1.8, 40, 5, 3, '/images/pain.jpg', NOW()
WHERE NOT EXISTS (SELECT 1 FROM produits);

-- Insert test categories if empty
INSERT IGNORE INTO categories (id, nom, description)
SELECT 1, 'Fruits & Légumes', 'Produits frais'
UNION ALL
SELECT 2, 'Fruits Secs', 'Noix et fruits secs'
UNION ALL
SELECT 3, 'Viandes', 'Viandes fraîches'
UNION ALL
SELECT 4, 'Produits Laitiers', 'Lait et dérivés'
UNION ALL
SELECT 5, 'Boulangerie', 'Pain et pâtisseries'
WHERE NOT EXISTS (SELECT 1 FROM categories);

-- ============================================
-- 5. VERIFY DATA
-- ============================================

-- Count records in each table
SELECT 'utilisateurs' as table_name, COUNT(*) as count FROM utilisateurs
UNION ALL
SELECT 'produits', COUNT(*) FROM produits
UNION ALL
SELECT 'categories', COUNT(*) FROM categories
UNION ALL
SELECT 'commandes', COUNT(*) FROM commandes
UNION ALL
SELECT 'commande_articles', COUNT(*) FROM commande_articles
UNION ALL
SELECT 'utilisateur_adresses', COUNT(*) FROM utilisateur_adresses;

-- View all products
SELECT p.id, p.nom, p.prix, p.quantite, c.nom as categorie
FROM produits p
LEFT JOIN categories c ON p.categorie_id = c.id
ORDER BY p.nom;

-- View all users
SELECT id, nom, email, role FROM utilisateurs;

-- View all orders with user info
SELECT c.id, u.nom, c.montant_total, c.statut, c.created_at
FROM commandes c
LEFT JOIN utilisateurs u ON c.utilisateur_id = u.id
ORDER BY c.created_at DESC;

-- ============================================
-- 6. VERIFY FRONTEND-REQUIRED DATA
-- ============================================

-- Check if products have merchant info
SELECT p.id, p.nom, p.prix, p.quantite, 
       c.nom as categorie,
       u.nom as merchant
FROM produits p
LEFT JOIN categories c ON p.categorie_id = c.id
LEFT JOIN utilisateurs u ON p.commercant_id = u.id;

-- Check if addresses exist for users
SELECT ua.id, u.nom, ua.adresse, ua.is_default
FROM utilisateur_adresses ua
LEFT JOIN utilisateurs u ON ua.utilisateur_id = u.id;

-- ============================================
-- 7. BACKUP IMPORTANT
-- ============================================

-- Backup command:
-- mysqldump -u root -p database_name > backup.sql

-- Restore command:
-- mysql -u root -p database_name < backup.sql

-- ============================================
-- 8. CLEANUP (Optional - Use with caution!)
-- ============================================

-- Delete all test orders
-- DELETE FROM commandes WHERE id > 0;

-- Delete all test addresses
-- DELETE FROM utilisateur_adresses WHERE id > 0;

-- Reset auto-increment
-- ALTER TABLE commandes AUTO_INCREMENT = 1;
-- ALTER TABLE utilisateur_adresses AUTO_INCREMENT = 1;

-- ============================================
-- END OF SCRIPT
-- ============================================
-- All tables should now be ready for frontend!
-- Run the SELECT queries above to verify data.
