import { fetchWithDigest } from '@/utils/fetchWithDigest';

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

      console.log("fetching", url)

      const body = await fetchWithDigest(url, this.config.username, this.config.password);

      console.log("body", body)

      return { status: "unknown", power: "unknown" };
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
