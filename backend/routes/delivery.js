const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Get available orders for delivery (livreur)
router.get('/available', authenticate, authorize('livreur'), async (req, res) => {
  try {
    const { lat, lng } = req.query;

    // Get orders that have been accepted by merchant OR are waiting for merchant acceptance,
    // and are not yet assigned to a delivery person
    const [orders] = await pool.execute(
      `SELECT c.*, 
              GROUP_CONCAT(CONCAT(p.nom, ' (x', cp.quantite, ')') SEPARATOR ', ') as produits,
              m.nom as commercant_nom,
              m.adresse as commercant_adresse,
              m.latitude as commercant_latitude,
              m.longitude as commercant_longitude,
              u.nom as client_nom,
              c.adresse_livraison as client_adresse,
              c.latitude_livraison as client_latitude,
              c.longitude_livraison as client_longitude
       FROM commandes c
       JOIN commande_produit cp ON c.id = cp.commande_id
       JOIN produits p ON cp.produit_id = p.id
       JOIN commercants m ON p.commercant_id = m.id
       JOIN utilisateurs u ON c.client_id = u.id
       WHERE (c.statut = 'acceptee' OR c.statut = 'en_attente') AND c.livreur_id IS NULL
       GROUP BY c.id
       ORDER BY c.date_commande ASC`
    );

    // Calculate distance if coordinates provided
    if (lat && lng) {
      orders.forEach(order => {
        if (order.commercant_latitude && order.commercant_longitude) {
          order.distance = calculateDistance(
            parseFloat(lat),
            parseFloat(lng),
            parseFloat(order.commercant_latitude),
            parseFloat(order.commercant_longitude)
          );
        }
      });
      orders.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
    }

    res.json({
      success: true,
      orders
    });
  } catch (error) {
    console.error('Get available orders error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des commandes' });
  }
});

// Accept delivery (livreur)
router.post('/:id/accept', authenticate, authorize('livreur'), async (req, res) => {
  try {
    const { id } = req.params;
    const livreurId = req.user.id;

    // Check if order is available (either 'en_attente' or 'acceptee')
    const [orders] = await pool.execute(
      'SELECT * FROM commandes WHERE id = ? AND (statut = ? OR statut = ?) AND livreur_id IS NULL',
      [id, 'acceptee', 'en_attente']
    );

    if (orders.length === 0) {
      return res.status(400).json({ success: false, message: 'Cette commande n\'est plus disponible' });
    }

    // Assign delivery person
    await pool.execute(
      'UPDATE commandes SET livreur_id = ?, statut = ? WHERE id = ?',
      [livreurId, 'en_livraison', id]
    );

    // Notify client
    await pool.execute(
      'INSERT INTO notifications (utilisateur_id, message, type) VALUES (?, ?, ?)',
      [orders[0].client_id, `Votre commande #${id} est en cours de livraison`, 'livraison_en_cours']
    );

    // Emit Socket.io event to update admin dashboard in real-time
    const { getIO } = require('../utils/socket');
    const io = getIO();
    io.emit('order-accepted', {
      orderId: id,
      livreurId: livreurId,
      statut: 'en_livraison'
    });

    res.json({
      success: true,
      message: 'Livraison acceptée avec succès'
    });
  } catch (error) {
    console.error('Accept delivery error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de l\'acceptation de la livraison' });
  }
});

// Get my deliveries (livreur)
router.get('/my-deliveries', authenticate, authorize('livreur'), async (req, res) => {
  try {
    const livreurId = req.user.id;
    const { statut } = req.query;

    let query = `
      SELECT c.*, 
             GROUP_CONCAT(CONCAT(p.nom, ' (x', cp.quantite, ')') SEPARATOR ', ') as produits,
             m.nom as commercant_nom,
             m.adresse as commercant_adresse,
             m.latitude as commercant_latitude,
             m.longitude as commercant_longitude,
             u.nom as client_nom,
             u.telephone as client_telephone,
             c.adresse_livraison as client_adresse,
             c.latitude_livraison as client_latitude,
             c.longitude_livraison as client_longitude
      FROM commandes c
      JOIN commande_produit cp ON c.id = cp.commande_id
      JOIN produits p ON cp.produit_id = p.id
      JOIN commercants m ON p.commercant_id = m.id
      JOIN utilisateurs u ON c.client_id = u.id
      WHERE c.livreur_id = ?
    `;
    const params = [livreurId];

    if (statut) {
      query += ' AND c.statut = ?';
      params.push(statut);
    }

    query += ' GROUP BY c.id ORDER BY c.date_commande DESC';

    const [deliveries] = await pool.execute(query, params);

    res.json({
      success: true,
      deliveries
    });
  } catch (error) {
    console.error('Get my deliveries error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des livraisons' });
  }
});

// Update delivery status (livreur)
router.put('/:id/status', authenticate, authorize('livreur'), [
  body('statut').isIn(['en_livraison', 'livree']).withMessage('Statut invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id } = req.params;
    const { statut, latitude, longitude } = req.body;
    const livreurId = req.user.id;

    // Verify delivery ownership
    const [orders] = await pool.execute(
      'SELECT * FROM commandes WHERE id = ? AND livreur_id = ?',
      [id, livreurId]
    );

    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: 'Livraison non trouvée' });
    }

    // Update order status
    await pool.execute(
      'UPDATE commandes SET statut = ? WHERE id = ?',
      [statut, id]
    );

    // Update delivery person location
    if (latitude && longitude) {
      await pool.execute(
        'UPDATE utilisateurs SET latitude = ?, longitude = ? WHERE id = ?',
        [latitude, longitude, livreurId]
      );
    }

    // If delivered, update payment status if cash
    if (statut === 'livree') {
      const [payments] = await pool.execute(
        'SELECT * FROM paiements WHERE commande_id = ? AND methode = ?',
        [id, 'cash']
      );

      if (payments.length > 0) {
        await pool.execute(
          'UPDATE paiements SET statut = ? WHERE commande_id = ?',
          ['paye', id]
        );
      }

      // Notify client
      await pool.execute(
        'INSERT INTO notifications (utilisateur_id, message, type) VALUES (?, ?, ?)',
        [orders[0].client_id, `Votre commande #${id} a été livrée`, 'commande_livree']
      );
    }

    res.json({
      success: true,
      message: 'Statut de livraison mis à jour'
    });
  } catch (error) {
    console.error('Update delivery status error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour du statut' });
  }
});

// Update delivery location (for real-time tracking)
router.post('/:id/location', authenticate, authorize('livreur'), [
  body('latitude').isFloat().withMessage('Latitude invalide'),
  body('longitude').isFloat().withMessage('Longitude invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id } = req.params;
    const { latitude, longitude } = req.body;
    const livreurId = req.user.id;

    // Verify delivery ownership
    const [orders] = await pool.execute(
      'SELECT client_id FROM commandes WHERE id = ? AND livreur_id = ?',
      [id, livreurId]
    );

    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: 'Livraison non trouvée' });
    }

    // Update delivery person location
    await pool.execute(
      'UPDATE utilisateurs SET latitude = ?, longitude = ? WHERE id = ?',
      [latitude, longitude, livreurId]
    );

    // Emit socket event for real-time tracking
    const { getIO } = require('../utils/socket');
    const io = getIO();
    io.to(`user-${orders[0].client_id}`).emit('delivery-location', {
      commande_id: id,
      latitude,
      longitude
    });

    res.json({
      success: true,
      message: 'Position mise à jour'
    });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour de la position' });
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

// Cancel delivery (livreur)
router.post('/:id/cancel', authenticate, authorize('livreur'), async (req, res) => {
  try {
    const { id } = req.params;
    const livreurId = req.user.id;

    // Verify delivery ownership
    const [orders] = await pool.execute(
      'SELECT * FROM commandes WHERE id = ? AND livreur_id = ?',
      [id, livreurId]
    );

    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: 'Livraison non trouvée' });
    }

    // Cancel the order
    await pool.execute(
      'UPDATE commandes SET statut = ?, livreur_id = NULL WHERE id = ?',
      ['annulee', id]
    );

    // Emit Socket.io event to update admin dashboard in real-time
    const { getIO } = require('../utils/socket');
    const io = getIO();
    io.emit('order-cancelled', {
      orderId: id,
      statut: 'annulee'
    });

    res.json({
      success: true,
      message: 'Commande annulée avec succès'
    });
  } catch (error) {
    console.error('Cancel delivery error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de l\'annulation de la commande' });
  }
});

// Refuse delivery (livreur refuses before accepting)
router.post('/:id/refuse', authenticate, authorize('livreur'), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if order exists and is available
    const [orders] = await pool.execute(
      'SELECT * FROM commandes WHERE id = ? AND (statut = ? OR statut = ?) AND livreur_id IS NULL',
      [id, 'acceptee', 'en_attente']
    );

    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: 'Commande non trouvée ou indisponible' });
    }

    // Cancel/refuse the order
    await pool.execute(
      'UPDATE commandes SET statut = ? WHERE id = ?',
      ['annulee', id]
    );

    // Emit Socket.io event to update admin dashboard in real-time
    const { getIO } = require('../utils/socket');
    const io = getIO();
    io.emit('order-refused', {
      orderId: id,
      statut: 'annulee'
    });

    res.json({
      success: true,
      message: 'Commande refusée'
    });
  } catch (error) {
    console.error('Refuse delivery error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors du refus de la commande' });
  }
});

module.exports = router;

