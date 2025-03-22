import { machineService } from '@/services/machineService';
import { ComputerStations } from '@/constants/ComputerStations';
import { DecToHex } from '@/utils/DecToHex';

export interface StationData {
  id: number;
  stationId: string;
  status: string;
  power: string;
  lastSeen?: string;
}

export async function getStationsData(): Promise<StationData[]> {
  try {
    const stationsData = await Promise.all(
      ComputerStations.map(async (station) => {
        const stationId = DecToHex(station);
        const host = `station-${stationId}.local`; // Adjust this pattern to match your network setup

        try {
          const data = await machineService.fetchMachineData(host, 'status');
          return {
            id: station,
            stationId,
            ...data
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
