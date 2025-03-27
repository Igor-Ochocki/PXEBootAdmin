import fetch from 'node-fetch';
import https from 'https';
import http from 'http';
import dns from 'dns';
import { promisify } from 'util';
import crypto from 'crypto';
// Parse the WWW-Authenticate header to get necessary parts
function parseAuthHeader(authHeader) {
    const regex = /(\w+)="([^"]+)"/g;
    const authParams = {
        realm: '',
        nonce: ''
    };
    let match;
    while (match = regex.exec(authHeader)) {
        authParams[match[1]] = match[2];
    }
    if (!authParams.realm || !authParams.nonce) {
        throw new Error('Missing required digest authentication parameters');
    }
    return authParams;
}
// Construct the Digest Authorization header
function constructDigestAuthHeader(authParams, options) {
    const { realm, nonce } = authParams;
    const { url, username, password } = options;
    // Generate cnonce and nc (nonce count)
    const cnonce = crypto.randomBytes(16).toString('hex');
    const nc = '00000001';
    const qop = 'auth';
    // Create A1 and A2 hashes (used in Digest calculation)
    const A1 = `${username}:${realm}:${password}`;
    const A2 = `POST:${url}`;
    const ha1 = crypto.createHash('md5').update(A1).digest('hex');
    const ha2 = crypto.createHash('md5').update(A2).digest('hex');
    // Generate the response hash (Digest Authentication response)
    const response = crypto.createHash('md5').update(`${ha1}:${nonce}:${nc}:${cnonce}:${qop}:${ha2}`).digest('hex');
    // Construct the final Digest Authorization header
    return `Digest username="${username}", realm="${realm}", nonce="${nonce}", uri="${url}", cnonce="${cnonce}", nc=${nc}, qop=${qop}, response="${response}"`;
}
// 1. First, we make a request to get the WWW-Authenticate header.
async function getDigestHeader(options) {
    try {
        const response = await fetch(options.url, {
            method: 'GET',
            headers: {
                'User-Agent': 'node-fetch',
                'Accept': '*/*',
            },
        });
        const wwwAuthenticate = response.headers.get('www-authenticate');
        if (!wwwAuthenticate) {
            throw new Error('No WWW-Authenticate header received');
        }
        // Parse the Digest Authentication challenge
        const authParams = parseAuthHeader(wwwAuthenticate);
        const digestHeader = constructDigestAuthHeader(authParams, options);
        return digestHeader;
    }
    catch (error) {
        console.error('Error in getting WWW-Authenticate header:', error);
        return undefined;
    }
}
const lookup = promisify(dns.lookup);
export var PowerState;
(function (PowerState) {
    PowerState[PowerState["PowerOn"] = 2] = "PowerOn";
    PowerState[PowerState["PowerOff"] = 8] = "PowerOff";
    PowerState[PowerState["Reset"] = 10] = "Reset";
})(PowerState || (PowerState = {}));
export class AMTManager {
    baseUrl = '';
    auth;
    config;
    agent = null;
    resolvedHost;
    constructor(config) {
        this.config = {
            port: 16992,
            protocol: 'http',
            timeout: 5000,
            retries: 3,
            verifySSL: false,
            forceIPv4: true,
            ...config
        };
        this.resolvedHost = config.host;
        this.auth = Buffer.from(`${config.username}:${config.password}`).toString('base64');
    }
    async resolveHost() {
        try {
            const result = await lookup(this.config.host, {
                family: this.config.forceIPv4 ? 4 : 0,
                hints: this.config.forceIPv4 ? dns.ADDRCONFIG : 0
            });
            this.resolvedHost = result.address;
            console.log(`Resolved host ${this.config.host} to ${this.resolvedHost}`);
            const port = this.config.port;
            const protocol = this.config.protocol;
            this.baseUrl = `${protocol}://${this.resolvedHost}:${port}/wsman`;
            // Configure agent based on protocol
            if (protocol === 'https') {
                this.agent = new https.Agent({
                    rejectUnauthorized: this.config.verifySSL,
                    keepAlive: true,
                    timeout: this.config.timeout,
                    ciphers: 'ALL',
                    secureProtocol: 'TLSv1_2_method',
                    family: this.config.forceIPv4 ? 4 : undefined
                });
            }
            else {
                this.agent = new http.Agent({
                    keepAlive: true,
                    timeout: this.config.timeout,
                    family: this.config.forceIPv4 ? 4 : undefined
                });
            }
        }
        catch (error) {
            console.error('Failed to resolve host:', error);
            throw new Error(`Failed to resolve host ${this.config.host}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async makeRequest(action, body, retryCount = 0) {
        // Ensure host is resolved before making request
        if (!this.baseUrl || !this.agent) {
            await this.resolveHost();
        }
        const digestHeader = await getDigestHeader({ url: this.baseUrl, username: this.config.username, password: this.config.password });
        const requestOptions = {
            method: 'POST',
            headers: {
                'Authorization': digestHeader,
                'Content-Type': 'application/soap+xml;charset=UTF-8',
                'SOAPAction': action,
                'User-Agent': 'Intel AMT Client',
                'Accept': '*/*',
                'Connection': 'keep-alive'
            },
            body,
            agent: this.agent,
            timeout: this.config.timeout
        };
        try {
            console.log(`Making request to ${this.baseUrl}`);
            console.log('Request headers:', requestOptions.headers);
            console.log('Request body:', body);
            const response = await fetch(this.baseUrl, requestOptions);
            console.log('Response status:', response.status);
            console.log('Response headers:', Object.fromEntries(response.headers.entries()));
            if (!response.ok) {
                const responseText = await response.text();
                console.error('Error response body:', responseText);
                throw new Error(`AMT request failed: ${response.status} ${response.statusText}\nResponse: ${responseText}`);
            }
            return response;
        }
        catch (error) {
            const systemError = error;
            // Handle specific TLS/connection errors
            if (systemError.code === 'ECONNRESET' ||
                systemError.code === 'ETIMEDOUT' ||
                systemError.code === 'ECONNREFUSED' ||
                systemError.type === 'system') {
                if (retryCount < this.config.retries) {
                    console.log(`Connection attempt ${retryCount + 1} failed:`, {
                        error: systemError.message,
                        code: systemError.code,
                        host: this.resolvedHost,
                        port: this.config.port
                    });
                    // Wait before retrying (exponential backoff)
                    const delay = Math.pow(2, retryCount) * 1000;
                    console.log(`Waiting ${delay}ms before retry...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    // Try to resolve host again before retry
                    await this.resolveHost();
                    return this.makeRequest(action, body, retryCount + 1);
                }
                throw new Error(`Failed to connect to AMT device after ${this.config.retries} attempts. ` +
                    `Last error: ${systemError.message} (${this.resolvedHost}:${this.config.port})`);
            }
            throw error;
        }
    }
    createPowerStateChangeRequest(powerState) {
        return `<?xml version="1.0" encoding="utf-8"?>
      <Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                xmlns:xsd="http://www.w3.org/2001/XMLSchema"
                xmlns:a="http://schemas.xmlsoap.org/ws/2004/08/addressing"
                xmlns:w="http://schemas.dmtf.org/wbem/wsman/1/wsman.xsd"
                xmlns="http://www.w3.org/2003/05/soap-envelope">
        <Header>
          <a:Action>http://schemas.dmtf.org/wbem/wscim/1/cim-schema/2/CIM_PowerManagementService/RequestPowerStateChange</a:Action>
          <a:To>/wsman</a:To>
          <w:ResourceURI>http://schemas.dmtf.org/wbem/wscim/1/cim-schema/2/CIM_PowerManagementService</w:ResourceURI>
          <a:MessageID>1</a:MessageID>
          <a:ReplyTo>
            <a:Address>http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous</a:Address>
          </a:ReplyTo>
          <w:OperationTimeout>PT60S</w:OperationTimeout>
        </Header>
        <Body>
          <r:RequestPowerStateChange_INPUT xmlns:r="http://schemas.dmtf.org/wbem/wscim/1/cim-schema/2/CIM_PowerManagementService">
            <r:PowerState>${powerState}</r:PowerState>
            <r:ManagedElement>
              <Address xmlns="http://schemas.xmlsoap.org/ws/2004/08/addressing">http://schemas.xmlsoap.org/ws/2004/08/addressing</Address>
              <ReferenceParameters xmlns="http://schemas.xmlsoap.org/ws/2004/08/addressing">
                <ResourceURI xmlns="http://schemas.dmtf.org/wbem/wsman/1/wsman.xsd">http://schemas.dmtf.org/wbem/wscim/1/cim-schema/2/CIM_ComputerSystem</ResourceURI>
                <SelectorSet xmlns="http://schemas.dmtf.org/wbem/wsman/1/wsman.xsd">
                  <Selector Name="CreationClassName">CIM_ComputerSystem</Selector>
                  <Selector Name="Name">ManagedSystem</Selector>
                </SelectorSet>
              </ReferenceParameters>
            </r:ManagedElement>
          </r:RequestPowerStateChange_INPUT>
        </Body>
      </Envelope>`;
    }
    createGetPowerStateRequest() {
        return `<?xml version="1.0" encoding="utf-8"?>
<Envelope xmlns="http://www.w3.org/2003/05/soap-envelope"
          xmlns:a="http://schemas.xmlsoap.org/ws/2004/08/addressing"
          xmlns:w="http://schemas.dmtf.org/wbem/wsman/1/wsman.xsd">
  <Header>
    <a:To>/wsman</a:To>
    <a:Action>http://schemas.xmlsoap.org/ws/2004/09/transfer/Get</a:Action>
    <a:MessageID>uuid:${crypto.randomUUID()}</a:MessageID>
    <a:ReplyTo>
      <a:Address>http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous</a:Address>
    </a:ReplyTo>
    <w:ResourceURI>http://schemas.dmtf.org/wbem/wscim/1/cim-schema/2/CIM_AssociatedPowerManagementService</w:ResourceURI>
    <w:SelectorSet>
      <w:Selector Name="UserOfService">
        <a:EndpointReference>
          <a:Address>http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous</a:Address>
          <a:ReferenceParameters>
            <w:ResourceURI>http://schemas.dmtf.org/wbem/wscim/1/cim-schema/2/CIM_ComputerSystem</w:ResourceURI>
            <w:SelectorSet>
              <w:Selector Name="CreationClassName">CIM_ComputerSystem</w:Selector>
              <w:Selector Name="Name">ManagedSystem</w:Selector>
            </w:SelectorSet>
          </a:ReferenceParameters>
        </a:EndpointReference>
      </w:Selector>
      <w:Selector Name="ServiceProvided">
        <a:EndpointReference>
          <a:Address>http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous</a:Address>
          <a:ReferenceParameters>
            <w:ResourceURI>http://schemas.dmtf.org/wbem/wscim/1/cim-schema/2/CIM_PowerManagementService</w:ResourceURI>
            <w:SelectorSet>
              <w:Selector Name="CreationClassName">CIM_PowerManagementService</w:Selector>
              <w:Selector Name="Name">Intel(r) AMT Power Management Service</w:Selector>
              <w:Selector Name="SystemCreationClassName">CIM_ComputerSystem</w:Selector>
              <w:Selector Name="SystemName">Intel(r) AMT</w:Selector>
            </w:SelectorSet>
          </a:ReferenceParameters>
        </a:EndpointReference>
      </w:Selector>
    </w:SelectorSet>
  </Header>
  <Body/>
</Envelope>`;
    }
    async changePowerState(powerState) {
        try {
            const response = await this.makeRequest('http://schemas.dmtf.org/wbem/wscim/1/cim-schema/2/CIM_PowerManagementService/RequestPowerStateChange', this.createPowerStateChangeRequest(powerState));
            const text = await response.text();
            console.log('Power state change response:', text);
            // Check if the response contains a success indicator
            return text.includes('ReturnValue>0</');
        }
        catch (error) {
            console.error('AMT power state change failed:', error);
            throw error;
        }
    }
    async powerOn() {
        return this.changePowerState(PowerState.PowerOn);
    }
    async powerOff() {
        return this.changePowerState(PowerState.PowerOff);
    }
    async reset() {
        return this.changePowerState(PowerState.Reset);
    }
    async getPowerState() {
        try {
            const response = await this.makeRequest('http://schemas.dmtf.org/wbem/wscim/1/wsman/Enumerate', this.createGetPowerStateRequest());
            const text = await response.text();
            console.log('Get power state response:', text);
            // Extract power state from response using CIM namespace
            const match = text.match(/<r:PowerState>(\d+)<\/r:PowerState>/);
            return match ? parseInt(match[1], 10) : -1;
        }
        catch (error) {
            console.error('Failed to get power state:', error);
            throw error;
        }
    }
    async testConnection() {
        try {
            // Try to get power state as a connection test
            await this.getPowerState();
            return true;
        }
        catch (error) {
            const systemError = error;
            console.error('Connection test failed:', {
                error: systemError.message,
                code: systemError.code,
                type: systemError.type
            });
            return false;
        }
    }
}
// Example usage:
/*
const amtManager = new AMTManager({
  host: '192.168.1.100',
  username: 'admin',
  password: 'your_password'
});

try {
  await amtManager.powerOn();
  console.log('Power on command sent successfully');
} catch (error) {
  console.error('Failed to power on:', error);
}
*/
