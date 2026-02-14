const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get segments for a station
router.get('/:stationId', (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT * FROM segments
      WHERE station_id = ?
      ORDER BY position ASC
    `);
    const segments = stmt.all(req.params.stationId);
    
    // Parse JSON config for each segment
    const parsedSegments = segments.map(seg => ({
      ...seg,
      config: JSON.parse(seg.config)
    }));
    
    res.json(parsedSegments);
  } catch (error) {
    console.error('Get segments error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add segment (requires auth and station ownership)
router.post('/:stationId', authMiddleware, (req, res) => {
  try {
    const { type, config, position } = req.body;
    
    // Check station ownership
    const station = db.prepare('SELECT * FROM stations WHERE id = ?').get(req.params.stationId);
    if (!station) {
      return res.status(404).json({ error: 'Station not found' });
    }
    if (station.user_id !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Validate type
    if (!['track', 'tts', 'volume_dip'].includes(type)) {
      return res.status(400).json({ error: 'Invalid segment type' });
    }

    // Get next position if not provided
    let pos = position;
    if (pos === undefined) {
      const maxPos = db.prepare('SELECT MAX(position) as max FROM segments WHERE station_id = ?').get(req.params.stationId);
      pos = (maxPos.max || -1) + 1;
    }

    const stmt = db.prepare(`
      INSERT INTO segments (station_id, type, position, config)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(
      req.params.stationId,
      type,
      pos,
      JSON.stringify(config)
    );
    
    const segment = db.prepare('SELECT * FROM segments WHERE id = ?').get(result.lastInsertRowid);
    res.json({
      ...segment,
      config: JSON.parse(segment.config)
    });
  } catch (error) {
    console.error('Add segment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update segment (requires auth and station ownership)
router.put('/:stationId/:segmentId', authMiddleware, (req, res) => {
  try {
    const { config, position } = req.body;
    
    // Check station ownership
    const station = db.prepare('SELECT * FROM stations WHERE id = ?').get(req.params.stationId);
    if (!station) {
      return res.status(404).json({ error: 'Station not found' });
    }
    if (station.user_id !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const segment = db.prepare('SELECT * FROM segments WHERE id = ?').get(req.params.segmentId);
    if (!segment) {
      return res.status(404).json({ error: 'Segment not found' });
    }

    const updates = [];
    const params = [];
    
    if (config !== undefined) {
      updates.push('config = ?');
      params.push(JSON.stringify(config));
    }
    
    if (position !== undefined) {
      updates.push('position = ?');
      params.push(position);
    }

    if (updates.length === 0) {
      return res.json({
        ...segment,
        config: JSON.parse(segment.config)
      });
    }

    params.push(req.params.segmentId);
    
    const stmt = db.prepare(`UPDATE segments SET ${updates.join(', ')} WHERE id = ?`);
    stmt.run(...params);
    
    const updated = db.prepare('SELECT * FROM segments WHERE id = ?').get(req.params.segmentId);
    res.json({
      ...updated,
      config: JSON.parse(updated.config)
    });
  } catch (error) {
    console.error('Update segment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete segment (requires auth and station ownership)
router.delete('/:stationId/:segmentId', authMiddleware, (req, res) => {
  try {
    // Check station ownership
    const station = db.prepare('SELECT * FROM stations WHERE id = ?').get(req.params.stationId);
    if (!station) {
      return res.status(404).json({ error: 'Station not found' });
    }
    if (station.user_id !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    db.prepare('DELETE FROM segments WHERE id = ?').run(req.params.segmentId);
    
    res.json({ message: 'Segment deleted' });
  } catch (error) {
    console.error('Delete segment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reorder segments (requires auth and station ownership)
router.post('/:stationId/reorder', authMiddleware, (req, res) => {
  try {
    const { segmentIds } = req.body; // Array of segment IDs in new order
    
    // Check station ownership
    const station = db.prepare('SELECT * FROM stations WHERE id = ?').get(req.params.stationId);
    if (!station) {
      return res.status(404).json({ error: 'Station not found' });
    }
    if (station.user_id !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updateStmt = db.prepare('UPDATE segments SET position = ? WHERE id = ?');
    
    segmentIds.forEach((segmentId, index) => {
      updateStmt.run(index, segmentId);
    });
    
    res.json({ message: 'Segments reordered' });
  } catch (error) {
    console.error('Reorder segments error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
