const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get segments for a station
router.get('/:stationId', (req, res) => {
  try {
    db.all(
      'SELECT * FROM segments WHERE station_id = ? ORDER BY position ASC',
      [req.params.stationId],
      (err, segments) => {
        if (err) {
          console.error('Get segments error:', err);
          return res.status(500).json({ error: 'Server error' });
        }
        
        // Parse JSON config for each segment
        const parsedSegments = segments.map(seg => ({
          ...seg,
          config: JSON.parse(seg.config)
        }));
        
        res.json(parsedSegments);
      }
    );
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
    db.get('SELECT * FROM stations WHERE id = ?', [req.params.stationId], (err, station) => {
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

      // Validate type
      if (!['track', 'tts', 'volume_dip'].includes(type)) {
        return res.status(400).json({ error: 'Invalid segment type' });
      }

      // Get next position if not provided
      const insertSegment = (pos) => {
        db.run(
          'INSERT INTO segments (station_id, type, position, config) VALUES (?, ?, ?, ?)',
          [req.params.stationId, type, pos, JSON.stringify(config)],
          function(err) {
            if (err) {
              console.error('Add segment error:', err);
              return res.status(500).json({ error: 'Server error' });
            }
            
            db.get('SELECT * FROM segments WHERE id = ?', [this.lastID], (err, segment) => {
              if (err) {
                console.error('Get segment error:', err);
                return res.status(500).json({ error: 'Server error' });
              }
              res.json({
                ...segment,
                config: JSON.parse(segment.config)
              });
            });
          }
        );
      };

      if (position !== undefined) {
        insertSegment(position);
      } else {
        db.get(
          'SELECT MAX(position) as max FROM segments WHERE station_id = ?',
          [req.params.stationId],
          (err, result) => {
            if (err) {
              console.error('Get max position error:', err);
              return res.status(500).json({ error: 'Server error' });
            }
            const pos = (result.max || -1) + 1;
            insertSegment(pos);
          }
        );
      }
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
    db.get('SELECT * FROM stations WHERE id = ?', [req.params.stationId], (err, station) => {
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

      db.get('SELECT * FROM segments WHERE id = ?', [req.params.segmentId], (err, segment) => {
        if (err) {
          console.error('Get segment error:', err);
          return res.status(500).json({ error: 'Server error' });
        }
        
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
        
        db.run(
          `UPDATE segments SET ${updates.join(', ')} WHERE id = ?`,
          params,
          (err) => {
            if (err) {
              console.error('Update segment error:', err);
              return res.status(500).json({ error: 'Server error' });
            }
            
            db.get('SELECT * FROM segments WHERE id = ?', [req.params.segmentId], (err, updated) => {
              if (err) {
                console.error('Get updated segment error:', err);
                return res.status(500).json({ error: 'Server error' });
              }
              res.json({
                ...updated,
                config: JSON.parse(updated.config)
              });
            });
          }
        );
      });
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
    db.get('SELECT * FROM stations WHERE id = ?', [req.params.stationId], (err, station) => {
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

      db.run('DELETE FROM segments WHERE id = ?', [req.params.segmentId], (err) => {
        if (err) {
          console.error('Delete segment error:', err);
          return res.status(500).json({ error: 'Server error' });
        }
        res.json({ message: 'Segment deleted' });
      });
    });
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
    db.get('SELECT * FROM stations WHERE id = ?', [req.params.stationId], (err, station) => {
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

      // Update positions
      let completed = 0;
      segmentIds.forEach((segmentId, index) => {
        db.run('UPDATE segments SET position = ? WHERE id = ?', [index, segmentId], (err) => {
          if (err) {
            console.error('Reorder segments error:', err);
          }
          completed++;
          if (completed === segmentIds.length) {
            res.json({ message: 'Segments reordered' });
          }
        });
      });
    });
  } catch (error) {
    console.error('Reorder segments error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
