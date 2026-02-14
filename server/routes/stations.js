const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get all stations
router.get('/', (req, res) => {
  try {
    const { search, genre } = req.query;
    let query = `
      SELECT s.*, u.username as host
      FROM stations s
      JOIN users u ON s.user_id = u.id
    `;
    const params = [];
    const conditions = [];

    if (search) {
      conditions.push('(s.name LIKE ? OR s.description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (genre) {
      conditions.push('s.genre = ?');
      params.push(genre);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY s.created_at DESC';

    const stmt = db.prepare(query);
    const stations = stmt.all(...params);
    
    res.json(stations);
  } catch (error) {
    console.error('Get stations error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single station
router.get('/:id', (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT s.*, u.username as host
      FROM stations s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `);
    const station = stmt.get(req.params.id);
    
    if (!station) {
      return res.status(404).json({ error: 'Station not found' });
    }
    
    res.json(station);
  } catch (error) {
    console.error('Get station error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create station (requires auth)
router.post('/', authMiddleware, (req, res) => {
  try {
    const { name, description, genre, lat, lng, loop_broadcast } = req.body;
    
    if (!name || lat === undefined || lng === undefined) {
      return res.status(400).json({ error: 'Name, lat, and lng are required' });
    }

    const stmt = db.prepare(`
      INSERT INTO stations (name, description, genre, lat, lng, user_id, loop_broadcast)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      name,
      description || '',
      genre || '',
      lat,
      lng,
      req.userId,
      loop_broadcast !== undefined ? loop_broadcast : 1
    );
    
    const station = db.prepare('SELECT * FROM stations WHERE id = ?').get(result.lastInsertRowid);
    res.json(station);
  } catch (error) {
    console.error('Create station error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update station (requires auth and ownership)
router.put('/:id', authMiddleware, (req, res) => {
  try {
    const { name, description, genre, loop_broadcast } = req.body;
    
    const station = db.prepare('SELECT * FROM stations WHERE id = ?').get(req.params.id);
    
    if (!station) {
      return res.status(404).json({ error: 'Station not found' });
    }

    if (station.user_id !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const stmt = db.prepare(`
      UPDATE stations
      SET name = ?, description = ?, genre = ?, loop_broadcast = ?
      WHERE id = ?
    `);
    stmt.run(
      name || station.name,
      description !== undefined ? description : station.description,
      genre !== undefined ? genre : station.genre,
      loop_broadcast !== undefined ? loop_broadcast : station.loop_broadcast,
      req.params.id
    );
    
    const updated = db.prepare('SELECT * FROM stations WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (error) {
    console.error('Update station error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete station (requires auth and ownership)
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const station = db.prepare('SELECT * FROM stations WHERE id = ?').get(req.params.id);
    
    if (!station) {
      return res.status(404).json({ error: 'Station not found' });
    }

    if (station.user_id !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    db.prepare('DELETE FROM stations WHERE id = ?').run(req.params.id);
    
    res.json({ message: 'Station deleted' });
  } catch (error) {
    console.error('Delete station error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
