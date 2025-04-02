import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import fs from 'fs';

// Ensure the data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

const dbPath = path.join(dataDir, 'actions.db');

// Initialize database
export async function initDB() {
    const db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    // Create Actions table if it doesn't exist
    await db.exec(`
        CREATE TABLE IF NOT EXISTS Actions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId TEXT NOT NULL,
            action TEXT NOT NULL,
            stationId TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    return db;
}

// Log an action
export async function logAction(userId: string, action: string, stationId: string) {
    const db = await initDB();
    try {
        await db.run(
            'INSERT INTO Actions (userId, action, stationId) VALUES (?, ?, ?)',
            [userId, action, stationId]
        );
    } finally {
        await db.close();
    }
}
