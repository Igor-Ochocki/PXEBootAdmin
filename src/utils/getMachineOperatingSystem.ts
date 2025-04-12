import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function getMachineOperatingSystem(stationId: string): Promise<string | null> {
  try {
    // Run the get-station-symlink script with sudo
    const { stdout, stderr } = await execAsync(`sudo ./get-station-symlink ${stationId}`);

    if (stderr) {
      console.error('Error getting machine operating system:', stderr);
      return null;
    }

    // The script returns the operating system code (e.g., "linux-ubuntu")
    const operatingSystem = stdout.trim();

    // Return null if no operating system was found
    if (!operatingSystem) {
      return null;
    }

    return operatingSystem;
  } catch (error) {
    console.error('Error getting machine operating system:', error);
    return null;
  }
}