const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/profiles';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
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

// Update profile
router.put('/profile', authenticate, upload.single('photo'), [
  body('nom').optional().notEmpty().withMessage('Le nom ne peut pas être vide'),
  body('telephone').optional(),
  body('adresse').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { nom, telephone, adresse } = req.body;
    const userId = req.user.id;

    let updateFields = [];
    let updateValues = [];

    if (nom) {
      updateFields.push('nom = ?');
      updateValues.push(nom);
    }
    if (telephone !== undefined) {
      updateFields.push('telephone = ?');
      updateValues.push(telephone);
    }
    if (adresse !== undefined) {
      updateFields.push('adresse = ?');
      updateValues.push(adresse);
    }
    if (req.file) {
      updateFields.push('photo = ?');
      updateValues.push(req.file.path);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, message: 'Aucune donnée à mettre à jour' });
    }

    updateValues.push(userId);

    await pool.execute(
      `UPDATE utilisateurs SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    // Get updated user
    const [users] = await pool.execute(
      'SELECT id, nom, email, role, telephone, adresse, photo FROM utilisateurs WHERE id = ?',
      [userId]
    );

    res.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      user: users[0]
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour du profil' });
  }
});

// Change password
router.put('/change-password', authenticate, [
  body('ancien_mot_de_passe').notEmpty().withMessage('L\'ancien mot de passe est requis'),
  body('nouveau_mot_de_passe').isLength({ min: 6 }).withMessage('Le nouveau mot de passe doit contenir au moins 6 caractères')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { ancien_mot_de_passe, nouveau_mot_de_passe } = req.body;
    const userId = req.user.id;

    // Get current password
    const [users] = await pool.execute(
      'SELECT mot_de_passe FROM utilisateurs WHERE id = ?',
      [userId]
    );

    const isValidPassword = await bcrypt.compare(ancien_mot_de_passe, users[0].mot_de_passe);
    if (!isValidPassword) {
      return res.status(401).json({ success: false, message: 'Ancien mot de passe incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(nouveau_mot_de_passe, 10);

    // Update password
    await pool.execute(
      'UPDATE utilisateurs SET mot_de_passe = ? WHERE id = ?',
      [hashedPassword, userId]
    );

    res.json({
      success: true,
      message: 'Mot de passe modifié avec succès'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors du changement de mot de passe' });
  }
});

// Get user addresses
router.get('/addresses', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const [addresses] = await pool.execute(
      'SELECT id, nom, rue, ville, codepostal, pays, par_defaut FROM adresses WHERE utilisateur_id = ? ORDER BY par_defaut DESC, created_at DESC',
      [userId]
    );

    res.json({
      success: true,
      addresses
    });
  } catch (error) {
    console.error('Get addresses error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des adresses' });
  }
});

// Create address
router.post('/addresses', authenticate, [
  body('nom').notEmpty().withMessage('Le nom de l\'adresse est requis'),
  body('rue').notEmpty().withMessage('La rue est requise'),
  body('ville').notEmpty().withMessage('La ville est requise'),
  body('codepostal').notEmpty().withMessage('Le code postal est requis'),
  body('pays').notEmpty().withMessage('Le pays est requis')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { nom, rue, ville, codepostal, pays, par_defaut } = req.body;
    const userId = req.user.id;

    // If marking as default, unmark previous default
    if (par_defaut) {
      await pool.execute(
        'UPDATE adresses SET par_defaut = 0 WHERE utilisateur_id = ?',
        [userId]
      );
    }

    const [result] = await pool.execute(
      'INSERT INTO adresses (utilisateur_id, nom, rue, ville, codepostal, pays, par_defaut) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, nom, rue, ville, codepostal, pays, par_defaut ? 1 : 0]
    );

    res.status(201).json({
      success: true,
      message: 'Adresse créée avec succès',
      addressId: result.insertId
    });
  } catch (error) {
    console.error('Create address error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la création de l\'adresse' });
  }
});

// Update address
router.put('/addresses/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, rue, ville, codepostal, pays, par_defaut } = req.body;
    const userId = req.user.id;

    // Verify ownership
    const [addresses] = await pool.execute(
      'SELECT id FROM adresses WHERE id = ? AND utilisateur_id = ?',
      [id, userId]
    );

    if (addresses.length === 0) {
      return res.status(404).json({ success: false, message: 'Adresse non trouvée' });
    }

    // If marking as default, unmark previous default
    if (par_defaut) {
      await pool.execute(
        'UPDATE adresses SET par_defaut = 0 WHERE utilisateur_id = ? AND id != ?',
        [userId, id]
      );
    }

    const updateFields = [];
    const updateValues = [];

    if (nom) {
      updateFields.push('nom = ?');
      updateValues.push(nom);
    }
    if (rue) {
      updateFields.push('rue = ?');
      updateValues.push(rue);
    }
    if (ville) {
      updateFields.push('ville = ?');
      updateValues.push(ville);
    }
    if (codepostal) {
      updateFields.push('codepostal = ?');
      updateValues.push(codepostal);
    }
    if (pays) {
      updateFields.push('pays = ?');
      updateValues.push(pays);
    }
    if (par_defaut !== undefined) {
      updateFields.push('par_defaut = ?');
      updateValues.push(par_defaut ? 1 : 0);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, message: 'Aucune donnée à mettre à jour' });
    }

    updateValues.push(id);

    await pool.execute(
      `UPDATE adresses SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    res.json({
      success: true,
      message: 'Adresse mise à jour avec succès'
    });
  } catch (error) {
    console.error('Update address error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour de l\'adresse' });
  }
});

// Delete address
router.delete('/addresses/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify ownership
    const [addresses] = await pool.execute(
      'SELECT id FROM adresses WHERE id = ? AND utilisateur_id = ?',
      [id, userId]
    );

    if (addresses.length === 0) {
      return res.status(404).json({ success: false, message: 'Adresse non trouvée' });
    }

    await pool.execute('DELETE FROM adresses WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Adresse supprimée avec succès'
    });
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la suppression de l\'adresse' });
  }
});

module.exports = router;

