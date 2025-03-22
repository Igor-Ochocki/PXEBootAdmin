"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.machineService = void 0;
const fetchWithDigest_1 = require("@/utils/fetchWithDigest");
const cheerio = __importStar(require("cheerio"));
class MachineService {
    constructor(config) {
        this.config = config;
    }
    async fetchMachineData(host, file) {
        try {
            const url = `http://${host}:${this.config.port}/${file}`;
            const body = await (0, fetchWithDigest_1.fetchWithDigest)(url, this.config.username, this.config.password);
            if (!body) {
                throw new Error("No body");
            }
            // Load the HTML content into cheerio
            const $ = cheerio.load(body);
            // Find the row where the first cell contains "Power"
            const powerRow = $('td.r1').filter(function () {
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
        }
        catch (error) {
            console.error('Error fetching machine data:', error);
            return { status: "unknown" };
        }
    }
}
// Create a singleton instance with environment variables
exports.machineService = new MachineService({
    port: parseInt(process.env.MACHINE_PORT || '16992'),
    username: process.env.MACHINE_USERNAME || '',
    password: process.env.MACHINE_PASSWORD || ''
});
