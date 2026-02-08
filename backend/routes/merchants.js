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
    const uploadDir = 'uploads/merchants';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'merchant-' + uniqueSuffix + path.extname(file.originalname));
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

// Get all merchants (for clients)
router.get('/', async (req, res) => {
  try {
    const { category, search, lat, lng } = req.query;

    let query = `
      SELECT c.*, 
             AVG(e.note) as note_moyenne,
             COUNT(DISTINCT e.id) as nombre_avis,
             u.latitude, u.longitude
      FROM commercants c
      LEFT JOIN evaluations e ON c.id = e.commercant_id
      LEFT JOIN utilisateurs u ON c.utilisateur_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (category) {
      query += ' AND c.categorie_id = ?';
      params.push(category);
    }

    if (search) {
      query += ' AND (c.nom LIKE ? OR c.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' GROUP BY c.id ORDER BY c.nom';

    const [merchants] = await pool.execute(query, params);

    // Calculate distance if coordinates provided
    if (lat && lng) {
      merchants.forEach(merchant => {
        if (merchant.latitude && merchant.longitude) {
          merchant.distance = calculateDistance(
            parseFloat(lat),
            parseFloat(lng),
            parseFloat(merchant.latitude),
            parseFloat(merchant.longitude)
          );
        }
      });
      merchants.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
    }

    res.json({
      success: true,
      merchants
    });
  } catch (error) {
    console.error('Get merchants error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des commerces' });
  }
});

// Get merchant by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [merchants] = await pool.execute(
      `SELECT c.*, 
              AVG(e.note) as note_moyenne,
              COUNT(DISTINCT e.id) as nombre_avis,
              u.latitude, u.longitude
       FROM commercants c
       LEFT JOIN evaluations e ON c.id = e.commercant_id
       LEFT JOIN utilisateurs u ON c.utilisateur_id = u.id
       WHERE c.id = ?
       GROUP BY c.id`,
      [id]
    );

    if (merchants.length === 0) {
      return res.status(404).json({ success: false, message: 'Commerce non trouvé' });
    }

    res.json({
      success: true,
      merchant: merchants[0]
    });
  } catch (error) {
    console.error('Get merchant error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération du commerce' });
  }
});

// Create/Update merchant (for merchants)
router.post('/', authenticate, authorize('commercant', 'admin'), upload.single('image'), [
  body('nom').notEmpty().withMessage('Le nom est requis'),
  body('adresse').notEmpty().withMessage('L\'adresse est requise'),
  body('telephone').optional(),
  body('horaires').optional(),
  body('description').optional(),
  body('latitude').optional(),
  body('longitude').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { nom, adresse, telephone, horaires, description, latitude, longitude, categorie_id } = req.body;
    const userId = req.user.id;

    // Check if merchant already exists
    const [existing] = await pool.execute(
      'SELECT id FROM commercants WHERE utilisateur_id = ?',
      [userId]
    );

    if (existing.length > 0) {
      // Update existing merchant
      const updateFields = ['nom = ?', 'adresse = ?'];
      const updateValues = [nom, adresse];

      if (telephone) {
        updateFields.push('telephone = ?');
        updateValues.push(telephone);
      }
      if (horaires) {
        updateFields.push('horaires = ?');
        updateValues.push(horaires);
      }
      if (description) {
        updateFields.push('description = ?');
        updateValues.push(description);
      }
      if (req.file) {
        updateFields.push('image = ?');
        updateValues.push(req.file.path);
      }
      if (categorie_id) {
        updateFields.push('categorie_id = ?');
        updateValues.push(categorie_id);
      }

      updateValues.push(existing[0].id);

      await pool.execute(
        `UPDATE commercants SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );

      // Update user location
      if (latitude && longitude) {
        await pool.execute(
          'UPDATE utilisateurs SET latitude = ?, longitude = ? WHERE id = ?',
          [latitude, longitude, userId]
        );
      }

      res.json({
        success: true,
        message: 'Commerce mis à jour avec succès'
      });
    } else {
      // Create new merchant
      const [result] = await pool.execute(
        'INSERT INTO commercants (nom, adresse, telephone, horaires, description, image, utilisateur_id, categorie_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [nom, adresse, telephone || null, horaires || null, description || null, req.file ? req.file.path : null, userId, categorie_id || null]
      );

      // Update user location
      if (latitude && longitude) {
        await pool.execute(
          'UPDATE utilisateurs SET latitude = ?, longitude = ? WHERE id = ?',
          [latitude, longitude, userId]
        );
      }

      res.status(201).json({
        success: true,
        message: 'Commerce créé avec succès',
        merchantId: result.insertId
      });
    }
  } catch (error) {
    console.error('Create merchant error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la création du commerce' });
  }
});

// Get my merchant (for authenticated merchant)
router.get('/me/commerce', authenticate, authorize('commercant'), async (req, res) => {
  try {
    const userId = req.user.id;

    const [merchants] = await pool.execute(
      'SELECT * FROM commercants WHERE utilisateur_id = ?',
      [userId]
    );

    if (merchants.length === 0) {
      return res.status(404).json({ success: false, message: 'Commerce non trouvé' });
    }

    res.json({
      success: true,
      merchant: merchants[0]
    });
  } catch (error) {
    console.error('Get my merchant error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération du commerce' });
  }
});

// Helper function to calculate distance
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

module.exports = router;

