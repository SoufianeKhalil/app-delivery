const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Get my notifications
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { unread_only } = req.query;

    let query = 'SELECT * FROM notifications WHERE utilisateur_id = ?';
    const params = [userId];

    if (unread_only === 'true') {
      query += ' AND statut = ?';
      params.push('non_lu');
    }

    query += ' ORDER BY date DESC LIMIT 50';

    const [notifications] = await pool.execute(query, params);

    res.json({
      success: true,
      notifications
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des notifications' });
  }
});

// Mark notification as read
router.put('/:id/read', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify ownership
    const [notifications] = await pool.execute(
      'SELECT id FROM notifications WHERE id = ? AND utilisateur_id = ?',
      [id, userId]
    );

    if (notifications.length === 0) {
      return res.status(404).json({ success: false, message: 'Notification non trouvée' });
    }

    await pool.execute(
      'UPDATE notifications SET statut = ? WHERE id = ?',
      ['lu', id]
    );

    res.json({
      success: true,
      message: 'Notification marquée comme lue'
    });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour de la notification' });
  }
});

// Mark all as read
router.put('/read-all', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    await pool.execute(
      'UPDATE notifications SET statut = ? WHERE utilisateur_id = ? AND statut = ?',
      ['lu', userId, 'non_lu']
    );

    res.json({
      success: true,
      message: 'Toutes les notifications ont été marquées comme lues'
    });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour des notifications' });
  }
});

// Delete notification
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify ownership
    const [notifications] = await pool.execute(
      'SELECT id FROM notifications WHERE id = ? AND utilisateur_id = ?',
      [id, userId]
    );

    if (notifications.length === 0) {
      return res.status(404).json({ success: false, message: 'Notification non trouvée' });
    }

    await pool.execute('DELETE FROM notifications WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Notification supprimée'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la suppression de la notification' });
  }
});

module.exports = router;

