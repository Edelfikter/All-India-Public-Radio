const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '../radio.db'));

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS stations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    genre TEXT,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    user_id INTEGER NOT NULL,
    loop_broadcast INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS segments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    station_id INTEGER NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('track', 'tts', 'volume_dip')),
    position INTEGER NOT NULL,
    config TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_segments_station ON segments(station_id);
  CREATE INDEX IF NOT EXISTS idx_stations_user ON stations(user_id);
`);

console.log('Database initialized successfully');

module.exports = db;
