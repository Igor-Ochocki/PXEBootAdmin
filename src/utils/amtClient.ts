import { AmtConfig, POWER_STATES, RCC, RCCS, RCCS_OEM } from './amtTypes';
import { parseStringPromise } from 'xml2js';
import fetch from 'node-fetch';
import * as readline from 'readline';

interface SoapResponse {
  's:Envelope': {
    's:Body': Array<{
      [key: string]: Array<{
        [key: string]: Array<string>;
      }>;
    }>;
  };
}

export class AmtClient {
  private config: AmtConfig;
  private version?: string;

  constructor(config: AmtConfig) {
    this.config = config;
  }

  private async soapRequest(service: string, action: string, body: string): Promise<SoapResponse> {
    const url = `${this.config.protocol}://${this.config.host}:${this.config.port}/${service}`;
    const headers = {
      'Content-Type': 'text/xml;charset=UTF-8',
      'SOAPAction': `http://schemas.intel.com/platform/client/${service}/2004/01#${action}`,
    };

    if (this.config.debug) {
      console.log('SOAP Request:', { url, action, body });
    }

    const response = await fetch(url, {
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

    const result = await parseStringPromise(responseText);
    return result;
  }

  private async getVersion(): Promise<string> {
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

  private async getSystemPowerState(): Promise<number> {
    const body = `<?xml version="1.0" encoding="UTF-8"?>
      <s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
        <s:Body>
          <GetSystemPowerState xmlns="http://schemas.intel.com/platform/client/RemoteControl/2004/01"/>
        </s:Body>
      </s:Envelope>`;

    const result = await this.soapRequest('RemoteControlService', 'GetSystemPowerState', body);
    return parseInt(result['s:Envelope']['s:Body'][0]['GetSystemPowerStateResponse'][0]['PowerState'][0]);
  }

  private async getHostInfo(): Promise<{ hostname: string; domain: string }> {
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

  async getInfo(): Promise<void> {
    console.log(`### AMT info on machine '${this.config.host}' ###`);

    const version = await this.getVersion();
    console.log(`AMT version: ${version}`);

    const hostInfo = await this.getHostInfo();
    console.log(`Hostname: ${hostInfo.hostname}.${hostInfo.domain}`);

    const powerState = await this.getSystemPowerState();
    console.log(`Powerstate: ${POWER_STATES[powerState & 0x0f]}`);
  }

  async remoteControl(command: keyof typeof RCC, special?: keyof typeof RCCS | keyof typeof RCCS_OEM): Promise<void> {
    const hostInfo = await this.getHostInfo();

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await new Promise<string>(resolve => {
      rl.question(`host ${hostInfo.hostname}.${hostInfo.domain}, ${command} [y/N] ? `, resolve);
    });
    rl.close();

    if (!/^(y|yes)$/i.test(answer)) {
      console.log('canceled');
      return;
    }

    console.log(`execute: ${command}`);

    const specialCmd = special ? (RCCS[special as keyof typeof RCCS] || RCCS_OEM[special as keyof typeof RCCS_OEM]) : undefined;
    const body = `<?xml version="1.0" encoding="UTF-8"?>
      <s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
        <s:Body>
          <RemoteControl xmlns="http://schemas.intel.com/platform/client/RemoteControl/2004/01">
            <Command>${RCC[command]}</Command>
            <IanaOemNumber>343</IanaOemNumber>
            ${specialCmd ? `<SpecialCommand>${specialCmd}</SpecialCommand>` : ''}
            ${special && RCCS_OEM[special as keyof typeof RCCS_OEM] ? '<OEMparameters>1</OEMparameters>' : ''}
          </RemoteControl>
        </s:Body>
      </s:Envelope>`;

    await this.soapRequest('RemoteControlService', 'RemoteControl', body);
  }
}
