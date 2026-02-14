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

    db.all(query, params, (err, stations) => {
      if (err) {
        console.error('Get stations error:', err);
        return res.status(500).json({ error: 'Server error' });
      }
      res.json(stations);
    });
  } catch (error) {
    console.error('Get stations error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single station
router.get('/:id', (req, res) => {
  try {
    db.get(
      `SELECT s.*, u.username as host
       FROM stations s
       JOIN users u ON s.user_id = u.id
       WHERE s.id = ?`,
      [req.params.id],
      (err, station) => {
        if (err) {
          console.error('Get station error:', err);
          return res.status(500).json({ error: 'Server error' });
        }
        
        if (!station) {
          return res.status(404).json({ error: 'Station not found' });
        }
        
        res.json(station);
      }
    );
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

    db.run(
      `INSERT INTO stations (name, description, genre, lat, lng, user_id, loop_broadcast)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        description || '',
        genre || '',
        lat,
        lng,
        req.userId,
        loop_broadcast !== undefined ? loop_broadcast : 1
      ],
      function(err) {
        if (err) {
          console.error('Create station error:', err);
          return res.status(500).json({ error: 'Server error' });
        }
        
        db.get('SELECT * FROM stations WHERE id = ?', [this.lastID], (err, station) => {
          if (err) {
            console.error('Get station error:', err);
            return res.status(500).json({ error: 'Server error' });
          }
          res.json(station);
        });
      }
    );
  } catch (error) {
    console.error('Create station error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update station (requires auth and ownership)
router.put('/:id', authMiddleware, (req, res) => {
  try {
    const { name, description, genre, loop_broadcast } = req.body;
    
    db.get('SELECT * FROM stations WHERE id = ?', [req.params.id], (err, station) => {
      if (err) {
        console.error('Get station error:', err);
        return res.status(500).json({ error: 'Server error' });
      }
      
      if (!station) {
        return res.status(404).json({ error: 'Station not found' });
      }

      if (station.user_id !== req.userId) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      db.run(
        `UPDATE stations
         SET name = ?, description = ?, genre = ?, loop_broadcast = ?
         WHERE id = ?`,
        [
          name || station.name,
          description !== undefined ? description : station.description,
          genre !== undefined ? genre : station.genre,
          loop_broadcast !== undefined ? loop_broadcast : station.loop_broadcast,
          req.params.id
        ],
        (err) => {
          if (err) {
            console.error('Update station error:', err);
            return res.status(500).json({ error: 'Server error' });
          }
          
          db.get('SELECT * FROM stations WHERE id = ?', [req.params.id], (err, updated) => {
            if (err) {
              console.error('Get updated station error:', err);
              return res.status(500).json({ error: 'Server error' });
            }
            res.json(updated);
          });
        }
      );
    });
  } catch (error) {
    console.error('Update station error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete station (requires auth and ownership)
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    db.get('SELECT * FROM stations WHERE id = ?', [req.params.id], (err, station) => {
      if (err) {
        console.error('Get station error:', err);
        return res.status(500).json({ error: 'Server error' });
      }
      
      if (!station) {
        return res.status(404).json({ error: 'Station not found' });
      }

      if (station.user_id !== req.userId) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      db.run('DELETE FROM stations WHERE id = ?', [req.params.id], (err) => {
        if (err) {
          console.error('Delete station error:', err);
          return res.status(500).json({ error: 'Server error' });
        }
        res.json({ message: 'Station deleted' });
      });
    });
  } catch (error) {
    console.error('Delete station error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
