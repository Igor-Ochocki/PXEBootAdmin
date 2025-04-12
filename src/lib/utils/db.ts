import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import fs from 'fs';

// Ensure the data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

const dbPath = path.join(dataDir, 'wutsk.db');

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

    // Create OperatingSystems table if it doesn't exist
    await db.exec(`
        CREATE TABLE IF NOT EXISTS OperatingSystems (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT NOT NULL,
            name TEXT NOT NULL
        )
    `);

    // Create SubSystems table if it doesn't exist, with a foreign key reference to OperatingSystems
    await db.exec(`
        CREATE TABLE IF NOT EXISTS SubSystems (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT NOT NULL,
            name TEXT NOT NULL,
            operatingSystemId INTEGER,
            FOREIGN KEY (operatingSystemId) REFERENCES OperatingSystems(id)
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

// Get possible operating systems
export async function getOperatingSystems() {
    const db = await initDB();
    const operatingSystems = await db.all('SELECT DISTINCT operatingSystem FROM Actions');
    return operatingSystems;
}

// Get possible sub-systems
export async function getSubSystems(mainSystem: string) {
    const db = await initDB();
    const subSystems = await db.all('SELECT DISTINCT subSystem FROM Actions WHERE operatingSystem = ?', [mainSystem]);
    return subSystems;
}
