import { fetchWithRetry } from '@/utils/fetchWithRetry';

interface MachineConfig {
  port: number;
  username: string;
  password: string;
}

interface MachineStatus {
  status: string;
  power: string;
  lastSeen?: string;
  // Add other specific fields you expect from the machine
}

class MachineService {
  private config: MachineConfig;

  constructor(config: MachineConfig) {
    this.config = config;
  }

  async fetchMachineData(host: string, file: string): Promise<MachineStatus> {
    try {
      const url = `http://${host}:${this.config.port}/${file}`;

      const response = await fetchWithRetry(url, {
        auth: {
          username: this.config.username,
          password: this.config.password
        },
        retries: 1,
        retryDelay: 1000
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching machine data:', error);
      throw error;
    }
  }
}

// Create a singleton instance with environment variables
export const machineService = new MachineService({
  port: parseInt(process.env.MACHINE_PORT || '16992'),
  username: process.env.MACHINE_USERNAME || '',
  password: process.env.MACHINE_PASSWORD || ''
});
