import './schema';
import { getAllUsers } from './operations';

export async function initializeDatabase() {
  try {
    // Check if stations exist
    const users = getAllUsers.all();

    if (users.length === 0) {
      console.log('Initializing database with default users...');
      // The schema file will handle creating the initial users
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}
