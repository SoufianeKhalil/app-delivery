const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/products';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Seules les images sont autorisées'));
    }
  }
});

// Get products by merchant
router.get('/merchant/:merchantId', async (req, res) => {
  try {
    const { merchantId } = req.params;
    const { category, search } = req.query;

    let query = `
      SELECT p.*, c.nom as categorie_nom
      FROM produits p
      LEFT JOIN categories c ON p.categorie_id = c.id
      WHERE p.commercant_id = ?
    `;
    const params = [merchantId];

    if (category) {
      query += ' AND p.categorie_id = ?';
      params.push(category);
    }

    if (search) {
      query += ' AND (p.nom LIKE ? OR p.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY p.nom';

    const [products] = await pool.execute(query, params);

    res.json({
      success: true,
      products
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des produits' });
  }
});

// Get categories (must be before /:id)
router.get('/categories/all', async (req, res) => {
  try {
    const [categories] = await pool.execute('SELECT * FROM categories ORDER BY nom');
    res.json({ success: true, categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des catégories' });
  }
});

// Get all products (public endpoint)
router.get('/', async (req, res) => {
  try {
    const { search, category, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT p.*, c.nom as categorie_nom, m.nom as merchant_nom
      FROM produits p
      LEFT JOIN categories c ON p.categorie_id = c.id
      LEFT JOIN commercants m ON p.commercant_id = m.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ' AND (p.nom LIKE ? OR p.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (category) {
      query += ' AND p.categorie_id = ?';
      params.push(category);
    }

    query += ' ORDER BY p.nom LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [products] = await pool.execute(query, params);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM produits WHERE 1=1';
    const countParams = [];

    if (search) {
      countQuery += ' AND (nom LIKE ? OR description LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }

    if (category) {
      countQuery += ' AND categorie_id = ?';
      countParams.push(category);
    }

    const [countResult] = await pool.execute(countQuery, countParams);

    res.json({
      success: true,
      data: products,
      total: countResult[0].total,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: countResult[0].total
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des produits' });
  }
});

// Get product by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [products] = await pool.execute(
      `SELECT p.*, c.nom as categorie_nom
       FROM produits p
       LEFT JOIN categories c ON p.categorie_id = c.id
       WHERE p.id = ?`,
      [id]
    );

    if (products.length === 0) {
      return res.status(404).json({ success: false, message: 'Produit non trouvé' });
    }

    res.json({
      success: true,
      product: products[0]
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération du produit' });
  }
});

// Create product (merchant only)
router.post('/', authenticate, authorize('commercant', 'admin'), upload.single('image'), [
  body('nom').notEmpty().withMessage('Le nom est requis'),
  body('prix').isFloat({ min: 0 }).withMessage('Le prix doit être un nombre positif'),
  body('commercant_id').notEmpty().withMessage('L\'ID du commerçant est requis')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { nom, description, prix, quantite, commercant_id, categorie_id } = req.body;
    const userId = req.user.id;

    // Verify merchant ownership (unless admin)
    if (req.user.role !== 'admin') {
      const [merchants] = await pool.execute(
        'SELECT id FROM commercants WHERE id = ? AND utilisateur_id = ?',
        [commercant_id, userId]
      );

      if (merchants.length === 0) {
        return res.status(403).json({ success: false, message: 'Vous n\'êtes pas autorisé à ajouter des produits à ce commerce' });
      }
    }

    const [result] = await pool.execute(
      'INSERT INTO produits (nom, description, prix, quantite, image, commercant_id, categorie_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [nom, description || null, prix, quantite || 0, req.file ? req.file.path : null, commercant_id, categorie_id || null]
    );

    res.status(201).json({
      success: true,
      message: 'Produit créé avec succès',
      productId: result.insertId
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la création du produit' });
  }
});

// Update product
router.put('/:id', authenticate, authorize('commercant', 'admin'), upload.single('image'), [
  body('nom').optional().notEmpty().withMessage('Le nom ne peut pas être vide'),
  body('prix').optional().isFloat({ min: 0 }).withMessage('Le prix doit être un nombre positif')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id } = req.params;
    const { nom, description, prix, quantite, categorie_id } = req.body;
    const userId = req.user.id;

    // Get product and verify ownership
    const [products] = await pool.execute(
      'SELECT p.* FROM produits p JOIN commercants c ON p.commercant_id = c.id WHERE p.id = ?',
      [id]
    );

    if (products.length === 0) {
      return res.status(404).json({ success: false, message: 'Produit non trouvé' });
    }

    if (req.user.role !== 'admin') {
      const [merchants] = await pool.execute(
        'SELECT id FROM commercants WHERE id = ? AND utilisateur_id = ?',
        [products[0].commercant_id, userId]
      );

      if (merchants.length === 0) {
        return res.status(403).json({ success: false, message: 'Vous n\'êtes pas autorisé à modifier ce produit' });
      }
    }

    // Build update query
    const updateFields = [];
    const updateValues = [];

    if (nom) {
      updateFields.push('nom = ?');
      updateValues.push(nom);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(description);
    }
    if (prix) {
      updateFields.push('prix = ?');
      updateValues.push(prix);
    }
    if (quantite !== undefined) {
      updateFields.push('quantite = ?');
      updateValues.push(quantite);
    }
    if (categorie_id !== undefined) {
      updateFields.push('categorie_id = ?');
      updateValues.push(categorie_id);
    }
    if (req.file) {
      updateFields.push('image = ?');
      updateValues.push(req.file.path);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, message: 'Aucune donnée à mettre à jour' });
    }

    updateValues.push(id);

    await pool.execute(
      `UPDATE produits SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    res.json({
      success: true,
      message: 'Produit mis à jour avec succès'
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour du produit' });
  }
});

// Delete product
router.delete('/:id', authenticate, authorize('commercant', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Get product and verify ownership
    const [products] = await pool.execute(
      'SELECT p.* FROM produits p JOIN commercants c ON p.commercant_id = c.id WHERE p.id = ?',
      [id]
    );

    if (products.length === 0) {
      return res.status(404).json({ success: false, message: 'Produit non trouvé' });
    }

    if (req.user.role !== 'admin') {
      const [merchants] = await pool.execute(
        'SELECT id FROM commercants WHERE id = ? AND utilisateur_id = ?',
        [products[0].commercant_id, userId]
      );

      if (merchants.length === 0) {
        return res.status(403).json({ success: false, message: 'Vous n\'êtes pas autorisé à supprimer ce produit' });
      }
    }

    await pool.execute('DELETE FROM produits WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Produit supprimé avec succès'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la suppression du produit' });
  }
});

module.exports = router;

