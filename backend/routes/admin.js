const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require admin authentication
router.use(authenticate);
router.use(authorize('admin'));

// Get statistics
router.get('/statistics', async (req, res) => {
  try {
    const [stats] = await pool.execute(`
      SELECT 
        (SELECT COUNT(*) FROM utilisateurs WHERE role = 'client') as total_clients,
        (SELECT COUNT(*) FROM utilisateurs WHERE role = 'livreur') as total_livreurs,
        (SELECT COUNT(*) FROM utilisateurs WHERE role = 'commercant') as total_commercants,
        (SELECT COUNT(*) FROM commercants) as total_commerces,
        (SELECT COUNT(*) FROM commandes) as total_commandes,
        (SELECT COUNT(*) FROM commandes WHERE statut = 'livree') as commandes_livrees,
        (SELECT SUM(montant_total) FROM commandes WHERE statut = 'livree') as revenus_totaux,
        (SELECT COUNT(*) FROM commandes WHERE DATE(date_commande) = CURDATE()) as commandes_aujourdhui
    `);

    res.json({
      success: true,
      statistics: stats[0]
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des statistiques' });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const { role, search } = req.query;

    let query = 'SELECT id, nom, email, role, telephone, adresse, created_at FROM utilisateurs WHERE 1=1';
    const params = [];

    if (role) {
      query += ' AND role = ?';
      params.push(role);
    }

    if (search) {
      query += ' AND (nom LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY created_at DESC';

    const [users] = await pool.execute(query, params);

    res.json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des utilisateurs' });
  }
});

// Create user
router.post('/users', [
  body('nom').notEmpty().withMessage('Le nom est requis'),
  body('email').isEmail().withMessage('Email invalide'),
  body('mot_de_passe').isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères'),
  body('role').isIn(['client', 'livreur', 'commercant', 'admin']).withMessage('Rôle invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    const { nom, email, mot_de_passe, role, telephone, adresse } = req.body;
    const [existing] = await pool.execute('SELECT id FROM utilisateurs WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Cet email est déjà utilisé' });
    }
    const hashed = await bcrypt.hash(mot_de_passe, 10);
    const [result] = await pool.execute(
      'INSERT INTO utilisateurs (nom, email, mot_de_passe, role, telephone, adresse) VALUES (?, ?, ?, ?, ?, ?)',
      [nom, email, hashed, role, telephone || null, adresse || null]
    );
    if (role === 'commercant') {
      await pool.execute(
        'INSERT INTO commercants (nom, adresse, telephone, utilisateur_id) VALUES (?, ?, ?, ?)',
        [nom, adresse || '', telephone || '', result.insertId]
      );
    }
    res.status(201).json({
      success: true,
      message: 'Utilisateur créé',
      user: { id: result.insertId, nom, email, role }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la création' });
  }
});

// Update user
router.put('/users/:id', [
  body('nom').optional().notEmpty().withMessage('Le nom ne peut pas être vide'),
  body('email').optional().isEmail().withMessage('Email invalide'),
  body('mot_de_passe').optional().isLength({ min: 6 }).withMessage('Mot de passe min 6 caractères'),
  body('role').optional().isIn(['client', 'livreur', 'commercant', 'admin']).withMessage('Rôle invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    const { id } = req.params;
    const { nom, email, mot_de_passe, role, telephone, adresse } = req.body;
    const [users] = await pool.execute('SELECT id, role FROM utilisateurs WHERE id = ?', [id]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }
    const updates = [];
    const values = [];
    if (nom) { updates.push('nom = ?'); values.push(nom); }
    if (email) {
      const [ex] = await pool.execute('SELECT id FROM utilisateurs WHERE email = ? AND id != ?', [email, id]);
      if (ex.length > 0) return res.status(400).json({ success: false, message: 'Email déjà utilisé' });
      updates.push('email = ?'); values.push(email);
    }
    if (role) { updates.push('role = ?'); values.push(role); }
    if (telephone !== undefined) { updates.push('telephone = ?'); values.push(telephone || null); }
    if (adresse !== undefined) { updates.push('adresse = ?'); values.push(adresse || null); }
    if (mot_de_passe) {
      const hashed = await bcrypt.hash(mot_de_passe, 10);
      updates.push('mot_de_passe = ?'); values.push(hashed);
    }
    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'Aucune donnée à mettre à jour' });
    }
    values.push(id);
    await pool.execute(`UPDATE utilisateurs SET ${updates.join(', ')} WHERE id = ?`, values);
    res.json({ success: true, message: 'Utilisateur mis à jour' });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour' });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [users] = await pool.execute('SELECT id FROM utilisateurs WHERE id = ?', [id]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }
    await pool.execute('DELETE FROM utilisateurs WHERE id = ?', [id]);
    res.json({ success: true, message: 'Utilisateur supprimé' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la suppression' });
  }
});

// Activate/Deactivate user
router.put('/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { active } = req.body;

    await pool.execute(
      'UPDATE utilisateurs SET active = ? WHERE id = ?',
      [active ? 1 : 0, id]
    );

    res.json({
      success: true,
      message: `Utilisateur ${active ? 'activé' : 'désactivé'} avec succès`
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour du statut' });
  }
});

// Get all merchants
router.get('/merchants', async (req, res) => {
  try {
    const { search, status } = req.query;

    let query = `
      SELECT c.*, u.email, u.nom as proprietaire_nom, u.active
      FROM commercants c
      JOIN utilisateurs u ON c.utilisateur_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ' AND (c.nom LIKE ? OR u.email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (status) {
      query += ' AND u.active = ?';
      params.push(status === 'active' ? 1 : 0);
    }

    query += ' ORDER BY c.created_at DESC';

    const [merchants] = await pool.execute(query, params);

    res.json({
      success: true,
      merchants
    });
  } catch (error) {
    console.error('Get merchants error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des commerces' });
  }
});

// Create merchant (admin: create user + merchant or link to existing user)
router.post('/merchants', [
  body('nom').notEmpty().withMessage('Le nom est requis'),
  body('adresse').notEmpty().withMessage('L\'adresse est requise'),
  body('utilisateur_id').optional().isInt(),
  body('email').optional().isEmail(),
  body('mot_de_passe').optional().isLength({ min: 6 }),
  body('telephone').optional(),
  body('horaires').optional(),
  body('description').optional(),
  body('categorie_id').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    const { nom, adresse, utilisateur_id, email, mot_de_passe, telephone, horaires, description, categorie_id } = req.body;
    let uid = utilisateur_id;
    if (!uid && email && mot_de_passe) {
      const [ex] = await pool.execute('SELECT id FROM utilisateurs WHERE email = ?', [email]);
      if (ex.length > 0) return res.status(400).json({ success: false, message: 'Email déjà utilisé' });
      const hashed = await bcrypt.hash(mot_de_passe, 10);
      const [ins] = await pool.execute(
        'INSERT INTO utilisateurs (nom, email, mot_de_passe, role) VALUES (?, ?, ?, ?)',
        [nom, email, hashed, 'commercant']
      );
      uid = ins.insertId;
    }
    if (!uid) {
      return res.status(400).json({ success: false, message: 'Fournir utilisateur_id ou (email + mot_de_passe) pour créer un compte commerçant' });
    }
    const [exMerchant] = await pool.execute('SELECT id FROM commercants WHERE utilisateur_id = ?', [uid]);
    if (exMerchant.length > 0) {
      return res.status(400).json({ success: false, message: 'Cet utilisateur a déjà un commerce' });
    }
    const [result] = await pool.execute(
      'INSERT INTO commercants (nom, adresse, telephone, horaires, description, utilisateur_id, categorie_id, valide) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
      [nom, adresse || '', telephone || null, horaires || null, description || null, uid, categorie_id || null]
    );
    res.status(201).json({
      success: true,
      message: 'Commerce créé',
      merchant: { id: result.insertId, nom, adresse, utilisateur_id: uid }
    });
  } catch (error) {
    console.error('Create merchant error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la création' });
  }
});

// Update merchant
router.put('/merchants/:id', [
  body('nom').optional().notEmpty(),
  body('adresse').optional().notEmpty(),
  body('telephone').optional(),
  body('horaires').optional(),
  body('description').optional(),
  body('categorie_id').optional(),
  body('valide').optional().isBoolean()
], async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, adresse, telephone, horaires, description, categorie_id, valide } = req.body;
    const [m] = await pool.execute('SELECT id FROM commercants WHERE id = ?', [id]);
    if (m.length === 0) return res.status(404).json({ success: false, message: 'Commerce non trouvé' });
    const updates = [];
    const values = [];
    if (nom !== undefined) { updates.push('nom = ?'); values.push(nom); }
    if (adresse !== undefined) { updates.push('adresse = ?'); values.push(adresse); }
    if (telephone !== undefined) { updates.push('telephone = ?'); values.push(telephone); }
    if (horaires !== undefined) { updates.push('horaires = ?'); values.push(horaires); }
    if (description !== undefined) { updates.push('description = ?'); values.push(description); }
    if (categorie_id !== undefined) { updates.push('categorie_id = ?'); values.push(categorie_id); }
    if (valide !== undefined) { updates.push('valide = ?'); values.push(valide ? 1 : 0); }
    if (updates.length === 0) return res.status(400).json({ success: false, message: 'Aucune donnée à mettre à jour' });
    values.push(id);
    await pool.execute(`UPDATE commercants SET ${updates.join(', ')} WHERE id = ?`, values);
    res.json({ success: true, message: 'Commerce mis à jour' });
  } catch (error) {
    console.error('Update merchant error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour' });
  }
});

// Delete merchant
router.delete('/merchants/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [m] = await pool.execute('SELECT id, utilisateur_id FROM commercants WHERE id = ?', [id]);
    if (m.length === 0) return res.status(404).json({ success: false, message: 'Commerce non trouvé' });
    await pool.execute('DELETE FROM commercants WHERE id = ?', [id]);
    res.json({ success: true, message: 'Commerce supprimé' });
  } catch (error) {
    console.error('Delete merchant error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la suppression' });
  }
});

// Validate/Invalidate merchant
router.put('/merchants/:id/validate', async (req, res) => {
  try {
    const { id } = req.params;
    const { validated } = req.body;

    await pool.execute(
      'UPDATE commercants SET valide = ? WHERE id = ?',
      [validated ? 1 : 0, id]
    );

    res.json({
      success: true,
      message: `Commerce ${validated ? 'validé' : 'invalidé'} avec succès`
    });
  } catch (error) {
    console.error('Validate merchant error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la validation du commerce' });
  }
});

// Get all products (admin)
router.get('/products', async (req, res) => {
  try {
    const { merchantId } = req.query;
    let query = `
      SELECT p.*, c.nom as categorie_nom, m.nom as commercant_nom, m.id as commercant_id
      FROM produits p
      LEFT JOIN categories c ON p.categorie_id = c.id
      JOIN commercants m ON p.commercant_id = m.id
      WHERE 1=1
    `;
    const params = [];
    if (merchantId) {
      query += ' AND p.commercant_id = ?';
      params.push(merchantId);
    }
    query += ' ORDER BY p.id DESC';
    const [products] = await pool.execute(query, params);
    res.json({ success: true, products });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des produits' });
  }
});

// Get all orders
router.get('/orders', async (req, res) => {
  try {
    const { statut, date_from, date_to } = req.query;

    let query = `
      SELECT c.*, 
             u.nom as client_nom,
             u.email as client_email,
             l.nom as livreur_nom,
             m.nom as commercant_nom
      FROM commandes c
      JOIN utilisateurs u ON c.client_id = u.id
      LEFT JOIN utilisateurs l ON c.livreur_id = l.id
      JOIN commande_produit cp ON c.id = cp.commande_id
      JOIN produits p ON cp.produit_id = p.id
      JOIN commercants m ON p.commercant_id = m.id
      WHERE 1=1
    `;
    const params = [];

    if (statut) {
      query += ' AND c.statut = ?';
      params.push(statut);
    }

    if (date_from) {
      query += ' AND DATE(c.date_commande) >= ?';
      params.push(date_from);
    }

    if (date_to) {
      query += ' AND DATE(c.date_commande) <= ?';
      params.push(date_to);
    }

    query += ' GROUP BY c.id ORDER BY c.date_commande DESC';

    const [orders] = await pool.execute(query, params);

    res.json({
      success: true,
      orders
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des commandes' });
  }
});

module.exports = router;

