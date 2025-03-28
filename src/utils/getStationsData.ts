import { ComputerStations } from '@/constants/ComputerStations';
import { DecToHex } from '@/utils/DecToHex';
import { AMTManager, PowerState } from 'amt-manager-test';
import { config } from 'dotenv';

export interface StationData {
  id: number;
  stationId: string;
  status: string;
}

export async function getStationsData(): Promise<StationData[]> {
  try {

    const stationsData = await Promise.all(
      ComputerStations.map(async (station) => {
        const stationId = DecToHex(station);
        const host = `s${stationId}`;
        config();


        const amtClient = new AMTManager({
          host: host,
          port: 16992,
          username: process.env.AMT_USERNAME || 'admin',
          password: process.env.AMT_PASSWORD || 'password',
          protocol: 'http',
          timeout: 10000,
          retries: 3,
          verifySSL: true,
          forceIPv4: true
        });

        try {
          const data = await amtClient.getPowerState();
          return {
            id: station,
            stationId,
            status: data === PowerState.PowerOn ? 'Online' : 'Offline'
          };
        } catch {
          // If a station fails, return offline status instead of failing completely
          return {
            id: station,
            stationId,
            status: 'offline',
            power: 'unknown'
          };
        }
      })
    );

    return stationsData;
  } catch (error) {
    console.error('Error fetching stations data:', error);
    throw error;
  }
}
