// pages/api/select.js
import fs from 'fs/promises';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';

// Type definitions
interface LabDefinition {
  pattern: string;
  lab_key: string;
}

type MappingType = 'hostname' | 'mac' | 'mac_symbolic' | 'ip' | 'lab' | 'default';

interface Mapping {
  type: MappingType;
  key: string;
  target: string;
  version?: string;
  selectorUsed?: string;
}

interface Config {
  mappings: Mapping[];
  lab_definitions: LabDefinition[];
  mac_to_symbolic: Record<string, string>;
  default_target: {
    target: string;
    version?: string;
    type?: MappingType;
  };
}

// Path to your configuration file
const CONFIG_FILE_PATH = path.resolve(process.cwd(), 'ipxe-config.json');

// Base URL for your locally served iPXE scripts
const IPXE_SCRIPT_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

const defaultConfig: Config = {
  mappings: [],
  lab_definitions: [],
  mac_to_symbolic: {},
  default_target: { target: 'menu', type: 'default' }
};

let configCache: Config = defaultConfig;

async function getConfig(): Promise<Config> {
  if (process.env.NODE_ENV === 'production' && configCache !== defaultConfig) {
    return configCache;
  }
  try {
    const fileContent = await fs.readFile(CONFIG_FILE_PATH, 'utf-8');
    configCache = JSON.parse(fileContent);
    return configCache;
  } catch (error) {
    console.error("Failed to load iPXE configuration:", error);
    return defaultConfig;
  }
}

function getLabKeyFromHostname(hostname: string, labDefinitions: LabDefinition[]): string | null {
  if (!hostname || !labDefinitions) return null;
  for (const def of labDefinitions) {
    const regex = new RegExp(def.pattern, 'i');
    if (regex.test(hostname)) {
      return def.lab_key;
    }
  }
  return null;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const hostname = searchParams.get('hostname');
  const rawMac = searchParams.get('mac');
  const clientIp = request.headers.get('x-forwarded-for') || '';

  const config = await getConfig();

  let mac = '';
  if (rawMac) {
    mac = String(rawMac).replace(/-/g, ':').toLowerCase();
  }

  const symbolicMacName = mac && config.mac_to_symbolic && config.mac_to_symbolic[mac]
    ? config.mac_to_symbolic[mac]
    : null;

  let decision: Mapping | null = null;

  // 1. Try direct hostname
  if (hostname) {
    decision = config.mappings.find((m: Mapping) => m.type === 'hostname' && m.key === hostname) || null;
  }
  // 2. Try symbolic MAC name
  if (!decision && symbolicMacName) {
    decision = config.mappings.find((m: Mapping) => m.type === 'mac_symbolic' && m.key === symbolicMacName) || null;
  }
  // 3. Try MAC address
  if (!decision && mac) {
    decision = config.mappings.find((m: Mapping) => m.type === 'mac' && m.key === mac) || null;
  }
  // 4. Try IP address
  if (!decision && clientIp) {
    decision = config.mappings.find((m: Mapping) => m.type === 'ip' && m.key === clientIp) || null;
  }
  // 5. Try Lab derived from hostname
  if (!decision && hostname) {
    const labKey = getLabKeyFromHostname(hostname, config.lab_definitions);
    if (labKey) {
      decision = config.mappings.find((m: Mapping) => m.type === 'lab' && m.key === labKey) || null;
      if (decision) decision.selectorUsed = `lab:${labKey}`;
    }
  }
  // 6. Try default
  if (!decision) {
    decision = {
      ...config.default_target,
      type: 'default',
      key: 'default',
      selectorUsed: 'default'
    };
  }

  // Fallback if still no decision
  if (!decision || !decision.target) {
    decision = {
      target: 'menu',
      type: 'default',
      key: 'default',
      selectorUsed: '*'
    };
  }

  const target = decision.target;
  const version = decision.version || '';
  const type = decision.type || 'default';
  const selectorUsed = decision.selectorUsed || hostname || symbolicMacName || mac || clientIp || '*';

  const ipxeScriptLines: string[] = ['#!ipxe'];
  if (version) {
    ipxeScriptLines.push(`set VER ${version}`);
  }
  if (type) {
    ipxeScriptLines.push(`set TYP ${type}`);
  }

  let bootCommand = '';
  if (target.startsWith('iscsi:')) {
    bootCommand = `sanboot ${target}`;
  } else if (target.startsWith('http://') || target.startsWith('https://')) {
    bootCommand = `chain ${target}`;
  } else {
    const scriptName = target.endsWith('.ipxe') ? target : `${target}.ipxe`;
    bootCommand = `chain ${IPXE_SCRIPT_BASE_URL}/ipxe_scripts/${scriptName}`;
  }
  ipxeScriptLines.push(bootCommand);
  ipxeScriptLines.push('');

  const ipxeScript = ipxeScriptLines.join('\n');

  console.log(`select-api: Selector: "${selectorUsed}" -> Target: "${target}", Version: "${version}", Type: "${type}" (Client IP: ${clientIp}, Hostname: ${hostname}, MAC: ${mac}) -> ${bootCommand}`);

  return new NextResponse(ipxeScript, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}