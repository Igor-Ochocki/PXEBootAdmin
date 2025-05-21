import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import fs from 'fs';
import { removeScheduleTask } from '@/utils/scheduleTask';
import { MachineIpxeConfig } from '@/app/api/ipxe/route';

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
            code TEXT NOT NULL UNIQUE,
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
            FOREIGN KEY (operatingSystemId) REFERENCES OperatingSystems(id),
            UNIQUE (code, operatingSystemId)
        )
    `);

    // Create Schedules table if it doesn't exist, with a foreign key reference to OperatingSystems and SubSystems
    await db.exec(`
      CREATE TABLE IF NOT EXISTS Schedules (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId TEXT NOT NULL,
          stationId TEXT NOT NULL,
          startDate DATETIME NOT NULL,
          startTime DATETIME NOT NULL,
          duration INTEGER NOT NULL,
          operatingSystem TEXT NOT NULL,
          subSystem TEXT,
          jobId INTEGER NOT NULL,
          FOREIGN KEY (operatingSystem) REFERENCES OperatingSystems(code) ON DELETE CASCADE,
          FOREIGN KEY (subSystem) REFERENCES SubSystems(code) ON DELETE CASCADE
      )
    `);

    // Create Admins table if it doesn't exist
    await db.exec(`
      CREATE TABLE IF NOT EXISTS Admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId TEXT NOT NULL
      )
    `);

    // Create HostnameIpxeConfigs table if it doesn't exist
    await db.exec(`
      CREATE TABLE IF NOT EXISTS HostnameIpxeConfigs (
        hostname TEXT PRIMARY KEY,
        target_script_name TEXT NOT NULL,
        version_tag TEXT,
        type_tag TEXT
      )
    `);

    return db;
}

// Add an admin to the database
export async function addAdmin(userId: string) {
    const db = await initDB();
    await db.run('INSERT INTO Admins (userId) VALUES (?)', [userId]);
}

// Remove an admin from the database
export async function removeAdmin(userId: string) {
    const db = await initDB();
    console.log(userId);
    await db.run('DELETE FROM Admins WHERE userId = ?', [userId]);
}

// Get all admins from the database
export async function getAdmins() {
    const db = await initDB();
    const admins = await db.all('SELECT userId FROM Admins');
    return admins;
}

// Add a schedule to the database
export async function addSchedule(userId: string, stationId: string, startDate: string, startTime: string, duration: number, operatingSystem: string, subSystem: string, jobId: number) {
    const db = await initDB();
    if (subSystem != '') {
      await db.run(
          'INSERT INTO Schedules (userId, stationId, startDate, startTime, duration, operatingSystem, subSystem, jobId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [userId, stationId, startDate, startTime, duration, operatingSystem, subSystem, jobId]
        );
    } else {
        await db.run(
            'INSERT INTO Schedules (userId, stationId, startDate, startTime, duration, operatingSystem, subSystem, jobId) VALUES (?, ?, ?, ?, ?, ?, NULL, ?)',
            [userId, stationId, startDate, startTime, duration, operatingSystem, jobId]
        );
    }
}

// Delete a schedule from the database
export async function deleteSchedule(id: number, jobId: number) {
    const db = await initDB();
    await db.run('DELETE FROM Schedules WHERE id = ?', [id]);
    try {
        await removeScheduleTask({ jobId });
    } catch (error) {
        console.error('Error removing schedule task:', error);
    }
}

// Update jobId for a schedule
export async function updateScheduleJobId(id: number, jobId: string) {
    const db = await initDB();
    await db.run('UPDATE Schedules SET jobId = ? WHERE id = ?', [jobId, id]);
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

// Get operating system by code
export async function getOperatingSystemByCode(code: string) {
    const db = await initDB();
    const operatingSystem = await db.get('SELECT * FROM OperatingSystems WHERE code = ?', [code]);
    return operatingSystem;
}

// Add operating system
export async function addOperatingSystem(name: string, code: string) {
    const db = await initDB();
    await db.run('INSERT INTO OperatingSystems (name, code) VALUES (?, ?)', [name, code]);
}

// Delete operating system
export async function deleteOperatingSystem(id: number) {
    const db = await initDB();
    await db.run('DELETE FROM SubSystems WHERE operatingSystemId = ?', [id]);
    await db.run('DELETE FROM OperatingSystems WHERE id = ?', [id]);
}

// Get operating subsystem by code
export async function getOperatingSubsystemByCode(code: string, operatingSystemId: number) {
    const db = await initDB();
    const operatingSubsystem = await db.get('SELECT * FROM SubSystems WHERE code = ? AND operatingSystemId = ?', [code, operatingSystemId]);
    return operatingSubsystem;
}

// Add operating subsystem
export async function addOperatingSubsystem(code: string, name: string, operatingSystemId: number) {
    const db = await initDB();
    await db.run('INSERT INTO SubSystems (code, name, operatingSystemId) VALUES (?, ?, ?)', [code, name, operatingSystemId]);
}

// Delete operating subsystem
export async function deleteOperatingSubsystem(id: number) {
    const db = await initDB();
    await db.run('DELETE FROM SubSystems WHERE id = ?', [id]);
}

export async function setIpxeConfigByHostname(hostname: string, target_script_name: string, version_tag: string, type_tag: string) {
    const db = await initDB();
    const existingConfig = await db.get('SELECT * FROM HostnameIpxeConfigs WHERE hostname = ?', [hostname]);
    if (existingConfig) {
        await db.run('UPDATE HostnameIpxeConfigs SET target_script_name = ?, version_tag = ?, type_tag = ? WHERE hostname = ?', [target_script_name, version_tag, type_tag, hostname]);
    } else {
        await db.run('INSERT INTO HostnameIpxeConfigs (hostname, target_script_name, version_tag, type_tag) VALUES (?, ?, ?, ?)', [hostname, target_script_name, version_tag, type_tag]);
    }
}

export async function getMachineOperatingSystem(stationId: string) {
    const db = await initDB();
    const operatingSystem = await db.get('SELECT target_script_name, version_tag FROM HostnameIpxeConfigs WHERE hostname = ?', [stationId]);
    return `${operatingSystem.target_script_name} ${operatingSystem.version_tag}`;
}

export async function getIpxeConfigByHostname(hostname: string): Promise<MachineIpxeConfig | null> {
    const db = await open({ filename: dbPath, driver: sqlite3.Database });
    try {
        const config = await db.get<MachineIpxeConfig | undefined>(
            'SELECT target_script_name, version_tag, type_tag FROM HostnameIpxeConfigs WHERE hostname = ?',
            hostname
        );
        return config || null;
    } catch (error) {
        console.error(`Error fetching iPXE config for hostname ${hostname}:`, error);
        return null;
    } finally {
        await db.close();
    }
}

