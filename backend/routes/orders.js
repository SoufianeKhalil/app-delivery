const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Create order (client)
router.post('/', authenticate, authorize('client'), [
  body('produits').isArray({ min: 1 }).withMessage('Au moins un produit est requis'),
  body('adresse_livraison').notEmpty().withMessage('L\'adresse de livraison est requise'),
  body('methode_paiement').isIn(['cash', 'carte', 'wallet']).withMessage('Méthode de paiement invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { produits, adresse_livraison, methode_paiement, latitude, longitude } = req.body;
    const clientId = req.user.id;

    // Calculate total and verify products
    let montantTotal = 0;
    const productDetails = [];

    for (const item of produits) {
      const [products] = await pool.execute(
        'SELECT prix, quantite, nom FROM produits WHERE id = ?',
        [item.produit_id]
      );

      if (products.length === 0) {
        return res.status(404).json({ success: false, message: `Produit ${item.produit_id} non trouvé` });
      }

      const product = products[0];
      if (product.quantite < item.quantite) {
        return res.status(400).json({ success: false, message: `Stock insuffisant pour ${product.nom}` });
      }

      const itemTotal = product.prix * item.quantite;
      montantTotal += itemTotal;

      productDetails.push({
        produit_id: item.produit_id,
        quantite: item.quantite,
        prix: product.prix
      });
    }

    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Create order
      const [orderResult] = await connection.execute(
        'INSERT INTO commandes (client_id, statut, montant_total, adresse_livraison, latitude_livraison, longitude_livraison) VALUES (?, ?, ?, ?, ?, ?)',
        [clientId, 'en_attente', montantTotal, adresse_livraison, latitude || null, longitude || null]
      );

      const orderId = orderResult.insertId;

      // Add order products
      for (const item of productDetails) {
        await connection.execute(
          'INSERT INTO commande_produit (commande_id, produit_id, quantite, prix) VALUES (?, ?, ?, ?)',
          [orderId, item.produit_id, item.quantite, item.prix]
        );

        // Update product quantity
        await connection.execute(
          'UPDATE produits SET quantite = quantite - ? WHERE id = ?',
          [item.quantite, item.produit_id]
        );
      }

      // Create payment record
      await connection.execute(
        'INSERT INTO paiements (commande_id, methode, statut) VALUES (?, ?, ?)',
        [orderId, methode_paiement, 'en_attente']
      );

      // Get merchant ID from first product
      const [merchantInfo] = await connection.execute(
        'SELECT commercant_id FROM produits WHERE id = ?',
        [productDetails[0].produit_id]
      );

      // Create notification for merchant
      if (merchantInfo.length > 0) {
        const [merchant] = await connection.execute(
          'SELECT utilisateur_id FROM commercants WHERE id = ?',
          [merchantInfo[0].commercant_id]
        );

        if (merchant.length > 0) {
          await connection.execute(
            'INSERT INTO notifications (utilisateur_id, message, type) VALUES (?, ?, ?)',
            [merchant[0].utilisateur_id, `Nouvelle commande #${orderId}`, 'nouvelle_commande']
          );
        }
      }

      await connection.commit();

      // Get full order details
      const [orders] = await pool.execute(
        `SELECT c.*, 
                GROUP_CONCAT(CONCAT(p.nom, ' (x', cp.quantite, ')') SEPARATOR ', ') as produits
         FROM commandes c
         JOIN commande_produit cp ON c.id = cp.commande_id
         JOIN produits p ON cp.produit_id = p.id
         WHERE c.id = ?
         GROUP BY c.id`,
        [orderId]
      );

      res.status(201).json({
        success: true,
        message: 'Commande créée avec succès',
        order: orders[0]
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la création de la commande' });
  }
});

// Get my orders (client)
router.get('/my-orders', authenticate, authorize('client'), async (req, res) => {
  try {
    const clientId = req.user.id;
    const { statut } = req.query;

    let query = `
      SELECT c.*, 
             GROUP_CONCAT(CONCAT(p.nom, ' (x', cp.quantite, ')') SEPARATOR ', ') as produits,
             m.nom as commercant_nom,
             u.nom as livreur_nom
      FROM commandes c
      JOIN commande_produit cp ON c.id = cp.commande_id
      JOIN produits p ON cp.produit_id = p.id
      JOIN commercants m ON p.commercant_id = m.id
      LEFT JOIN utilisateurs u ON c.livreur_id = u.id
      WHERE c.client_id = ?
    `;
    const params = [clientId];

    if (statut) {
      query += ' AND c.statut = ?';
      params.push(statut);
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

// Get order by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    let query = `
      SELECT c.*, 
             GROUP_CONCAT(CONCAT(p.nom, ' (x', cp.quantite, ')') SEPARATOR ', ') as produits,
             m.nom as commercant_nom,
             m.id as commercant_id,
             u.nom as livreur_nom,
             u.telephone as livreur_telephone,
             u.latitude as livreur_latitude,
             u.longitude as livreur_longitude
      FROM commandes c
      JOIN commande_produit cp ON c.id = cp.commande_id
      JOIN produits p ON cp.produit_id = p.id
      JOIN commercants m ON p.commercant_id = m.id
      LEFT JOIN utilisateurs u ON c.livreur_id = u.id
      WHERE c.id = ?
      GROUP BY c.id
    `;

    const [orders] = await pool.execute(query, [id]);

    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: 'Commande non trouvée' });
    }

    const order = orders[0];

    // Verify access
    if (userRole === 'client' && order.client_id !== userId) {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    if (userRole === 'commercant') {
      const [merchants] = await pool.execute(
        'SELECT id FROM commercants WHERE id = ? AND utilisateur_id = ?',
        [order.commercant_id, userId]
      );
      if (merchants.length === 0) {
        return res.status(403).json({ success: false, message: 'Accès non autorisé' });
      }
    }

    // Get order products details
    const [orderProducts] = await pool.execute(
      `SELECT cp.*, p.nom, p.image
       FROM commande_produit cp
       JOIN produits p ON cp.produit_id = p.id
       WHERE cp.commande_id = ?`,
      [id]
    );

    order.produits_details = orderProducts;

    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération de la commande' });
  }
});

// Allowed statuses: admin can set any, merchant can set acceptee/refusee/annulee
const STATUS_OPTIONS = ['en_attente', 'acceptee', 'refusee', 'en_livraison', 'livree', 'annulee'];

// Cancel order (client only)
router.post('/:id/cancel', authenticate, authorize('client'), async (req, res) => {
  try {
    const { id } = req.params;
    const clientId = req.user.id;

    // Get order and verify ownership
    const [orders] = await pool.execute(
      'SELECT * FROM commandes WHERE id = ? AND client_id = ?',
      [id, clientId]
    );

    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: 'Commande non trouvée' });
    }

    const order = orders[0];

    // Only allow cancellation if order is in waiting state
    if (order.statut !== 'en_attente') {
      return res.status(400).json({ success: false, message: 'Cette commande ne peut pas être annulée (statut: ' + order.statut + ')' });
    }

    // Get order products to restore stock
    const [orderProducts] = await pool.execute(
      'SELECT * FROM commande_produit WHERE commande_id = ?',
      [id]
    );

    // Restore stock for each product
    for (const item of orderProducts) {
      await pool.execute(
        'UPDATE produits SET quantite = quantite + ? WHERE id = ?',
        [item.quantite, item.produit_id]
      );
    }

    // Update order status
    await pool.execute(
      'UPDATE commandes SET statut = ? WHERE id = ?',
      ['annulee', id]
    );

    // Create notification
    await pool.execute(
      'INSERT INTO notifications (utilisateur_id, message, type) VALUES (?, ?, ?)',
      [clientId, `Votre commande #${id} a été annulée`, 'statut_commande']
    );

    res.json({
      success: true,
      message: 'Commande annulée avec succès'
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de l\'annulation de la commande' });
  }
});

// Update order status (merchant or admin)
router.put('/:id/status', authenticate, authorize('commercant', 'admin', 'livreur'), [
  body('statut').isIn(STATUS_OPTIONS).withMessage('Statut invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id } = req.params;
    const { statut } = req.body;
    const userId = req.user.id;
    const role = req.user.role;

    const [orders] = await pool.execute(
      `SELECT c.*, p.commercant_id
       FROM commandes c
       JOIN commande_produit cp ON c.id = cp.commande_id
       JOIN produits p ON cp.produit_id = p.id
       WHERE c.id = ?
       LIMIT 1`,
      [id]
    );

    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: 'Commande non trouvée' });
    }

    if (role !== 'admin') {
      if (role === 'commercant') {
        const [merchants] = await pool.execute(
          'SELECT id FROM commercants WHERE id = ? AND utilisateur_id = ?',
          [orders[0].commercant_id, userId]
        );
        if (merchants.length === 0) {
          return res.status(403).json({ success: false, message: 'Non autorisé' });
        }
        if (!['acceptee', 'refusee', 'annulee'].includes(statut)) {
          return res.status(400).json({ success: false, message: 'Commerçant: statuts autorisés acceptee, refusee, annulee' });
        }
      } else if (role === 'livreur') {
        if (!['en_livraison', 'livree'].includes(statut)) {
          return res.status(400).json({ success: false, message: 'Livreur: statuts autorisés en_livraison, livree' });
        }
      }
    }

    const newStatus = statut === 'refusee' ? 'annulee' : statut;
    const dateLivraison = newStatus === 'livree' ? new Date() : null;

    if (dateLivraison) {
      await pool.execute(
        'UPDATE commandes SET statut = ?, date_livraison = ? WHERE id = ?',
        [newStatus, dateLivraison, id]
      );
    } else {
      await pool.execute(
        'UPDATE commandes SET statut = ? WHERE id = ?',
        [newStatus, id]
      );
    }

    const messages = {
      acceptee: 'acceptée',
      annulee: 'annulée',
      en_livraison: 'en livraison',
      livree: 'livrée'
    };
    await pool.execute(
      'INSERT INTO notifications (utilisateur_id, message, type) VALUES (?, ?, ?)',
      [orders[0].client_id, `Votre commande #${id} a été ${messages[newStatus] || newStatus}`, 'statut_commande']
    );

    res.json({
      success: true,
      message: 'Statut de la commande mis à jour'
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour du statut' });
  }
});

module.exports = router;

