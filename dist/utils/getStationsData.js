"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStationsData = getStationsData;
const machineService_1 = require("@/services/machineService");
const ComputerStations_1 = require("@/constants/ComputerStations");
const DecToHex_1 = require("@/utils/DecToHex");
async function getStationsData() {
    try {
        const stationsData = await Promise.all(ComputerStations_1.ComputerStations.map(async (station) => {
            const stationId = (0, DecToHex_1.DecToHex)(station);
            const host = `s${stationId}`;
            try {
                const data = await machineService_1.machineService.fetchMachineData(host, 'index.htm');
                return {
                    id: station,
                    stationId,
                    ...data
                };
            }
            catch (_a) {
                // If a station fails, return offline status instead of failing completely
                return {
                    id: station,
                    stationId,
                    status: 'offline',
                    power: 'unknown'
                };
            }
        }));
        return stationsData;
    }
    catch (error) {
        console.error('Error fetching stations data:', error);
        throw error;
    }
}
