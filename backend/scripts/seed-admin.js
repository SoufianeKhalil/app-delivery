/**
 * Crée ou met à jour le compte admin pour se connecter au dashboard.
 * Lancer depuis le dossier backend: node scripts/seed-admin.js
 *
 * Connexion: admin@admin.com / admin123
 */

const bcrypt = require('bcryptjs');
const pool = require('../config/database');

const ADMIN_EMAIL = 'admin@admin.com';
const ADMIN_PASSWORD = 'admin123';
const ADMIN_NAME = 'Administrateur';

async function seedAdmin() {
  try {
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

    const [existing] = await pool.execute(
      'SELECT id FROM utilisateurs WHERE email = ?',
      [ADMIN_EMAIL]
    );

    if (existing.length > 0) {
      await pool.execute(
        'UPDATE utilisateurs SET mot_de_passe = ?, role = ?, nom = ?, active = TRUE WHERE email = ?',
        [hashedPassword, 'admin', ADMIN_NAME, ADMIN_EMAIL]
      );
      console.log('Compte admin mis à jour. Connecte-toi avec:', ADMIN_EMAIL, '/', ADMIN_PASSWORD);
    } else {
      await pool.execute(
        'INSERT INTO utilisateurs (nom, email, mot_de_passe, role, active) VALUES (?, ?, ?, ?, TRUE)',
        [ADMIN_NAME, ADMIN_EMAIL, hashedPassword, 'admin']
      );
      console.log('Compte admin créé. Connecte-toi avec:', ADMIN_EMAIL, '/', ADMIN_PASSWORD);
    }
    process.exit(0);
  } catch (err) {
    console.error('Erreur:', err.message);
    process.exit(1);
  }
}

seedAdmin();
