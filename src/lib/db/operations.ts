import db from './config';

// User operations
export const createUser = db.prepare(`
  INSERT INTO users (email, name, isod_id, usos_id)
  VALUES (?, ?, ?, ?)
  RETURNING id, email, name, isod_id, usos_id
`);

export const getUserByUsosId = db.prepare(`
  SELECT * FROM users WHERE usos_id = ?
`);

export const getUserByIsodId = db.prepare(`
  SELECT * FROM users WHERE isod_id = ?
`);

// Computer station operations
export const getStationStatus = db.prepare(`
  SELECT * FROM computer_stations WHERE station_number = ?
`);

export const updateStationStatus = db.prepare(`
  UPDATE computer_stations
  SET status = ?, last_updated = CURRENT_TIMESTAMP
  WHERE station_number = ?
  RETURNING *
`);

export const getAllStations = db.prepare(`
  SELECT * FROM computer_stations ORDER BY station_number
`);

export const getAllUsers = db.prepare(`
  SELECT * FROM users ORDER BY usos_id
`);

// Reservation operations
export const createReservation = db.prepare(`
  INSERT INTO reservations (user_id, station_id, start_time, duration)
  VALUES (?, ?, ?, ?)
  RETURNING *
`);

export const getStationReservations = db.prepare(`
  SELECT
    r.*,
    u.name as user_name,
    u.usos_id,
    u.isod_id
  FROM reservations r
  JOIN users u ON r.user_id = u.id
  WHERE r.station_id = ?
  ORDER BY r.start_time
`);

export const getUserReservationsByUsosId = db.prepare(`
  SELECT
    r.*,
    u.name as user_name,
    u.usos_id,
    u.isod_id
  FROM reservations r
  JOIN users u ON r.user_id = u.id
  WHERE u.usos_id = ?
  ORDER BY r.start_time
`);

export const getUpcomingReservations = db.prepare(`
  SELECT
    r.*,
    u.name as user_name,
    u.usos_id,
    u.isod_id
  FROM reservations r
  JOIN users u ON r.user_id = u.id
  WHERE r.start_time >= datetime('now')
  ORDER BY r.start_time
`);

export const getStationReservationsForDate = db.prepare(`
  SELECT
    r.*,
    u.name as user_name,
    u.usos_id,
    u.isod_id
  FROM reservations r
  JOIN users u ON r.user_id = u.id
  WHERE r.station_id = ?
    AND date(r.start_time) = date(?)
  ORDER BY r.start_time
`);
