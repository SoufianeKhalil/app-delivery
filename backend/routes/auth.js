const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Register
router.post('/register', [
  body('nom').notEmpty().withMessage('Le nom est requis'),
  body('email').isEmail().withMessage('Email invalide'),
  body('mot_de_passe').isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères'),
  body('role').isIn(['client', 'livreur', 'commercant']).withMessage('Rôle invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { nom, email, mot_de_passe, role, telephone, adresse } = req.body;

    // Check if user exists
    const [existingUsers] = await pool.execute(
      'SELECT id FROM utilisateurs WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ success: false, message: 'Cet email est déjà utilisé' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(mot_de_passe, 10);

    // Insert user
    const [result] = await pool.execute(
      'INSERT INTO utilisateurs (nom, email, mot_de_passe, role, telephone, adresse) VALUES (?, ?, ?, ?, ?, ?)',
      [nom, email, hashedPassword, role, telephone || null, adresse || null]
    );

    // If merchant, create merchant entry
    if (role === 'commercant') {
      await pool.execute(
        'INSERT INTO commercants (nom, adresse, telephone, utilisateur_id) VALUES (?, ?, ?, ?)',
        [nom, adresse || '', telephone || '', result.insertId]
      );
    }

    // Generate token (fallback si .env manquant ou JWT_SECRET vide)
    const secret = (process.env.JWT_SECRET && String(process.env.JWT_SECRET).trim()) || 'dev-secret-change-in-production';
    const token = jwt.sign(
      { userId: result.insertId, role },
      secret,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Inscription réussie',
      token,
      user: {
        id: result.insertId,
        nom,
        email,
        role
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de l\'inscription' });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().withMessage('Email invalide'),
  body('mot_de_passe').notEmpty().withMessage('Le mot de passe est requis')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, mot_de_passe } = req.body;

    // Get user
    const [users] = await pool.execute(
      'SELECT id, nom, email, mot_de_passe, role, telephone, adresse FROM utilisateurs WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
    }

    const user = users[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(mot_de_passe, user.mot_de_passe);
    if (!isValidPassword) {
      return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
    }

    // Generate token (fallback si .env manquant ou JWT_SECRET vide)
    const secret = (process.env.JWT_SECRET && String(process.env.JWT_SECRET).trim()) || 'dev-secret-change-in-production';
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      secret,
      { expiresIn: '7d' }
    );

    // Remove password from response
    delete user.mot_de_passe;

    res.json({
      success: true,
      message: 'Connexion réussie',
      token,
      user
    });
  } catch (error) {
    console.error('Login error:', error);
    const msg = process.env.NODE_ENV === 'production'
      ? 'Erreur lors de la connexion'
      : (error.message || 'Erreur lors de la connexion');
    res.status(500).json({ success: false, message: msg });
  }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération du profil' });
  }
});

// Reset password request
router.post('/reset-password-request', [
  body('email').isEmail().withMessage('Email invalide')
], async (req, res) => {
  try {
    const { email } = req.body;
    
    const [users] = await pool.execute(
      'SELECT id FROM utilisateurs WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'Email non trouvé' });
    }

    // TODO: Send reset password email
    res.json({
      success: true,
      message: 'Un email de réinitialisation a été envoyé'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la demande de réinitialisation' });
  }
});

module.exports = router;

