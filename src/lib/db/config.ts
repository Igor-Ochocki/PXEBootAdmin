import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Ensure the data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// Initialize the database
const db = new Database(path.join(dataDir, 'wutsk.db'));

// Enable foreign keys
db.pragma('foreign_keys = ON');

export default db;
