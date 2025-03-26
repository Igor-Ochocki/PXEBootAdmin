import db from './config';

// Create users table
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    isod_id TEXT UNIQUE NOT NULL,
    usos_id INTEGER UNIQUE NOT NULL,
  )
`);

// Create reservations table
// duration in minutes
db.exec(`
  CREATE TABLE IF NOT EXISTS reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    station_id INTEGER NOT NULL,
    start_time DATETIME NOT NULL,
    duration INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`);

console.log('Database schema initialized successfully');
