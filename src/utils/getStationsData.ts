import { ComputerStations } from '@/constants/ComputerStations';
import { DecToHex, HexToDec } from '@/utils/DecToHex';
import { AMTManager, PowerState } from 'amt-manager-test';
import { config } from 'dotenv';

export interface StationData {
  id: number;
  stationId: string;
  status: string;
}

export async function getComputerState(stationId: string): Promise<StationData> {
  try {
    const host = `s${stationId}`;
    config();

    const amtClient = new AMTManager({
      host: host,
      port: 16992,
      username: process.env.AMT_USERNAME || 'admin',
      password: process.env.AMT_PASSWORD || 'password',
      protocol: 'http',
      timeout: 10000,
      retries: 1,
      verifySSL: true,
      forceIPv4: true
    });

    const fetchStationData = async () => {
      try {
        const data = await amtClient.getPowerState();
        return {
          id: HexToDec(stationId),
          stationId: stationId,
          status: data === PowerState.PowerOn ? 'ON' : 'OFF'
        };
      } catch {
        // If a station fails, return offline status instead of failing completely
        return {
          id: HexToDec(stationId),
          stationId: stationId,
          status: 'UNKNOWN'
        };
      }
    }

    const stationData = await fetchStationData();

    return stationData;
  } catch (error) {
    console.error('Error fetching stations data:', error);
    throw error;
  }
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
            status: data === PowerState.PowerOn ? 'ON' : 'OFF'
          };
        } catch {
          // If a station fails, return offline status instead of failing completely
          return {
            id: station,
            stationId,
            status: 'UNKNOWN'
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
