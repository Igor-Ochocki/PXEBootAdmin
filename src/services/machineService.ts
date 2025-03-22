import { fetchWithDigest } from '@/utils/fetchWithDigest';
import * as cheerio from 'cheerio';

interface MachineConfig {
  port: number;
  username: string;
  password: string;
}

interface MachineStatus {
  status: string;
}

class MachineService {
  private config: MachineConfig;

  constructor(config: MachineConfig) {
    this.config = config;
  }

  async fetchMachineData(host: string, file: string): Promise<MachineStatus> {
    try {
      const url = `http://${host}:${this.config.port}/${file}`;

      const body = await fetchWithDigest(url, this.config.username, this.config.password);

      if (!body) {
        throw new Error("No body");
      }

      // Load the HTML content into cheerio
      const $ = cheerio.load(body);

      // Find the row where the first cell contains "Power"
      const powerRow = $('td.r1').filter(function() {
        return $(this).find('p').text().trim() === 'Power';
      });

      // Get the next td element which contains the power status
      const powerStatus = powerRow.next('td.r1').text().trim();

      if (!powerStatus) {
        throw new Error("Could not find power status");
      }

      return {
        status: powerStatus.toLowerCase()
      };
    } catch (error) {
      console.error('Error fetching machine data:', error);
      return { status: "unknown" };
    }
  }
}

// Create a singleton instance with environment variables
export const machineService = new MachineService({
  port: parseInt(process.env.MACHINE_PORT || '16992'),
  username: process.env.MACHINE_USERNAME || '',
  password: process.env.MACHINE_PASSWORD || ''
});
