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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AmtClient = void 0;
const amtTypes_1 = require("./amtTypes");
const xml2js_1 = require("xml2js");
const node_fetch_1 = __importDefault(require("node-fetch"));
const readline = __importStar(require("readline"));
class AmtClient {
    constructor(config) {
        this.config = config;
    }
    async soapRequest(service, action, body) {
        const url = `${this.config.protocol}://${this.config.host}:${this.config.port}/${service}`;
        const headers = {
            'Content-Type': 'text/xml;charset=UTF-8',
            'SOAPAction': `http://schemas.intel.com/platform/client/${service}/2004/01#${action}`,
        };
        if (this.config.debug) {
            console.log('SOAP Request:', { url, action, body });
        }
        const response = await (0, node_fetch_1.default)(url, {
            method: 'POST',
            headers: {
                ...headers,
                'Authorization': 'Basic ' + Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64'),
            },
            body,
        });
        if (!response.ok) {
            throw new Error(`SOAP request failed: ${response.status} ${response.statusText}`);
        }
        const responseText = await response.text();
        if (this.config.debug) {
            console.log('SOAP Response:', responseText);
        }
        const result = await (0, xml2js_1.parseStringPromise)(responseText);
        return result;
    }
    async getVersion() {
        if (!this.version) {
            const body = `<?xml version="1.0" encoding="UTF-8"?>
        <s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
          <s:Body>
            <GetCoreVersion xmlns="http://schemas.intel.com/platform/client/SecurityAdministration/2004/01"/>
          </s:Body>
        </s:Envelope>`;
            const result = await this.soapRequest('SecurityAdministrationService', 'GetCoreVersion', body);
            this.version = result['s:Envelope']['s:Body'][0]['GetCoreVersionResponse'][0]['Version'][0];
        }
        return this.version;
    }
    async getSystemPowerState() {
        const body = `<?xml version="1.0" encoding="UTF-8"?>
      <s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
        <s:Body>
          <GetSystemPowerState xmlns="http://schemas.intel.com/platform/client/RemoteControl/2004/01"/>
        </s:Body>
      </s:Envelope>`;
        const result = await this.soapRequest('RemoteControlService', 'GetSystemPowerState', body);
        return parseInt(result['s:Envelope']['s:Body'][0]['GetSystemPowerStateResponse'][0]['PowerState'][0]);
    }
    async getHostInfo() {
        const hostnameBody = `<?xml version="1.0" encoding="UTF-8"?>
      <s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
        <s:Body>
          <GetHostName xmlns="http://schemas.intel.com/platform/client/NetworkAdministration/2004/01"/>
        </s:Body>
      </s:Envelope>`;
        const domainBody = `<?xml version="1.0" encoding="UTF-8"?>
      <s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
        <s:Body>
          <GetDomainName xmlns="http://schemas.intel.com/platform/client/NetworkAdministration/2004/01"/>
        </s:Body>
      </s:Envelope>`;
        const [hostnameResult, domainResult] = await Promise.all([
            this.soapRequest('NetworkAdministrationService', 'GetHostName', hostnameBody),
            this.soapRequest('NetworkAdministrationService', 'GetDomainName', domainBody),
        ]);
        return {
            hostname: hostnameResult['s:Envelope']['s:Body'][0]['GetHostNameResponse'][0]['HostName'][0],
            domain: domainResult['s:Envelope']['s:Body'][0]['GetDomainNameResponse'][0]['DomainName'][0],
        };
    }
    async getInfo() {
        console.log(`### AMT info on machine '${this.config.host}' ###`);
        const version = await this.getVersion();
        console.log(`AMT version: ${version}`);
        const hostInfo = await this.getHostInfo();
        console.log(`Hostname: ${hostInfo.hostname}.${hostInfo.domain}`);
        const powerState = await this.getSystemPowerState();
        console.log(`Powerstate: ${amtTypes_1.POWER_STATES[powerState & 0x0f]}`);
    }
    async remoteControl(command, special) {
        const hostInfo = await this.getHostInfo();
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        const answer = await new Promise(resolve => {
            rl.question(`host ${hostInfo.hostname}.${hostInfo.domain}, ${command} [y/N] ? `, resolve);
        });
        rl.close();
        if (!/^(y|yes)$/i.test(answer)) {
            console.log('canceled');
            return;
        }
        console.log(`execute: ${command}`);
        const specialCmd = special ? (amtTypes_1.RCCS[special] || amtTypes_1.RCCS_OEM[special]) : undefined;
        const body = `<?xml version="1.0" encoding="UTF-8"?>
      <s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
        <s:Body>
          <RemoteControl xmlns="http://schemas.intel.com/platform/client/RemoteControl/2004/01">
            <Command>${amtTypes_1.RCC[command]}</Command>
            <IanaOemNumber>343</IanaOemNumber>
            ${specialCmd ? `<SpecialCommand>${specialCmd}</SpecialCommand>` : ''}
            ${special && amtTypes_1.RCCS_OEM[special] ? '<OEMparameters>1</OEMparameters>' : ''}
          </RemoteControl>
        </s:Body>
      </s:Envelope>`;
        await this.soapRequest('RemoteControlService', 'RemoteControl', body);
    }
}
exports.AmtClient = AmtClient;
