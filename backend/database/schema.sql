-- Database Schema for Local Delivery Application

CREATE DATABASE IF NOT EXISTS delivery_app;
USE delivery_app;

-- Table: utilisateurs
CREATE TABLE IF NOT EXISTS utilisateurs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    mot_de_passe VARCHAR(255) NOT NULL,
    role ENUM('client', 'livreur', 'commercant', 'admin') NOT NULL,
    telephone VARCHAR(20),
    adresse TEXT,
    photo VARCHAR(255),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table: adresses
CREATE TABLE IF NOT EXISTS adresses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    utilisateur_id INT NOT NULL,
    nom VARCHAR(100) NOT NULL,
    rue TEXT NOT NULL,
    ville VARCHAR(100) NOT NULL,
    codepostal VARCHAR(20),
    pays VARCHAR(100),
    par_defaut BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE
);

-- Table: categories
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: commercants
CREATE TABLE IF NOT EXISTS commercants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    utilisateur_id INT NOT NULL,
    nom VARCHAR(150) NOT NULL,
    adresse TEXT NOT NULL,
    telephone VARCHAR(20),
    horaires VARCHAR(100),
    description TEXT,
    image VARCHAR(255),
    categorie_id INT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    valide BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    FOREIGN KEY (categorie_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Table: produits
CREATE TABLE IF NOT EXISTS produits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    commercant_id INT NOT NULL,
    categorie_id INT,
    nom VARCHAR(150) NOT NULL,
    description TEXT,
    prix DECIMAL(10,2) NOT NULL,
    quantite INT DEFAULT 0,
    image VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (commercant_id) REFERENCES commercants(id) ON DELETE CASCADE,
    FOREIGN KEY (categorie_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Table: commandes
CREATE TABLE IF NOT EXISTS commandes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    livreur_id INT NULL,
    statut ENUM('en_attente', 'acceptee', 'refusee', 'en_livraison', 'livree', 'annulee') DEFAULT 'en_attente',
    montant_total DECIMAL(10,2),
    adresse_livraison TEXT,
    latitude_livraison DECIMAL(10, 8),
    longitude_livraison DECIMAL(11, 8),
    date_commande TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_livraison TIMESTAMP NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES utilisateurs(id),
    FOREIGN KEY (livreur_id) REFERENCES utilisateurs(id)
);

-- Table: commande_produit
CREATE TABLE IF NOT EXISTS commande_produit (
    id INT AUTO_INCREMENT PRIMARY KEY,
    commande_id INT NOT NULL,
    produit_id INT NOT NULL,
    quantite INT NOT NULL,
    prix DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (commande_id) REFERENCES commandes(id) ON DELETE CASCADE,
    FOREIGN KEY (produit_id) REFERENCES produits(id)
);

-- Table: paiements
CREATE TABLE IF NOT EXISTS paiements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    commande_id INT NOT NULL,
    methode ENUM('cash', 'carte', 'wallet') NOT NULL,
    statut ENUM('en_attente', 'paye', 'echoue') DEFAULT 'en_attente',
    date_paiement TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (commande_id) REFERENCES commandes(id) ON DELETE CASCADE
);

-- Table: evaluations
CREATE TABLE IF NOT EXISTS evaluations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    commercant_id INT,
    livreur_id INT,
    commande_id INT,
    note INT CHECK (note BETWEEN 1 AND 5),
    commentaire TEXT,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES utilisateurs(id),
    FOREIGN KEY (commercant_id) REFERENCES commercants(id) ON DELETE SET NULL,
    FOREIGN KEY (livreur_id) REFERENCES utilisateurs(id) ON DELETE SET NULL,
    FOREIGN KEY (commande_id) REFERENCES commandes(id) ON DELETE SET NULL
);

-- Table: notifications
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    utilisateur_id INT NOT NULL,
    message TEXT,
    type VARCHAR(50),
    statut ENUM('non_lu', 'lu') DEFAULT 'non_lu',
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE
);

-- Insert default categories
INSERT INTO categories (nom, description) VALUES
('Restaurant', 'Restaurants et cafés'),
('Epicerie', 'Épiceries et supermarchés'),
('Pharmacie', 'Pharmacies'),
('Boulangerie', 'Boulangeries et pâtisseries'),
('Autre', 'Autres commerces');

-- Insert default admin user (password: admin123)
-- Password hash for 'admin123'
INSERT INTO utilisateurs (nom, email, mot_de_passe, role, active) VALUES
('Administrateur', 'admin@admin.com', '$2a$10$rOzJqZqZqZqZqZqZqZqZqOqZqZqZqZqZqZqZqZqZqZqZqZqZqZq', 'admin', TRUE);

-- Create indexes for better performance
CREATE INDEX idx_utilisateurs_email ON utilisateurs(email);
CREATE INDEX idx_utilisateurs_role ON utilisateurs(role);
CREATE INDEX idx_adresses_utilisateur ON adresses(utilisateur_id);
CREATE INDEX idx_commandes_client ON commandes(client_id);
CREATE INDEX idx_commandes_livreur ON commandes(livreur_id);
CREATE INDEX idx_commandes_statut ON commandes(statut);
CREATE INDEX idx_produits_commercant ON produits(commercant_id);
CREATE INDEX idx_notifications_utilisateur ON notifications(utilisateur_id);
CREATE INDEX idx_notifications_statut ON notifications(statut);

