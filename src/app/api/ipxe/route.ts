// pages/api/select.js
import { NextRequest, NextResponse } from 'next/server';
import { getIpxeConfigByHostname } from '@/lib/utils/db';

// Interface for the data expected from the database for a hostname
export interface MachineIpxeConfig {
  target_script_name: string;
  version_tag?: string;
  type_tag?: string;
}

// Base URL for your locally served iPXE scripts
const IPXE_SCRIPT_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Default configuration if hostname not found or not provided
const DEFAULT_IPXE_TARGET = 'menu'; // Default script name, e.g., menu.ipxe

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const hostname = searchParams.get('hostname');
  const clientIp = request.headers.get('x-forwarded-for') || ''; // Keep for logging

  let targetName: string;
  let version: string = '';
  let osType: string = '';
  let selectorUsed: string;

  if (hostname) {
    const machineConfig = await getIpxeConfigByHostname(hostname);
    if (machineConfig) {
      targetName = machineConfig.target_script_name;
      version = machineConfig.version_tag || '';
      osType = machineConfig.type_tag || '';
      selectorUsed = hostname;
    } else {
      // Hostname provided but not found in DB, use default
      targetName = DEFAULT_IPXE_TARGET;
      selectorUsed = `default_hostname_miss:${hostname}`;
    }
  } else {
    // No hostname provided, use default
    targetName = DEFAULT_IPXE_TARGET;
    selectorUsed = 'default_no_hostname';
  }

  const ipxeScriptLines: string[] = ['#!ipxe'];
  if (version) {
    ipxeScriptLines.push(`set VER ${version}`);
  } else {
    ipxeScriptLines.push(``);
  }
  if (osType) {
    ipxeScriptLines.push(`set TYP ${osType}`);
  } else {
    ipxeScriptLines.push(``);
  }

  let bootCommand = '';
  if (targetName.startsWith('iscsi:')) {
    bootCommand = `sanboot ${targetName}`;
  } else if (targetName.startsWith('http://') || targetName.startsWith('https://')) {
    bootCommand = `chain ${targetName}`;
  } else {
    const scriptName = targetName.endsWith('.ipxe') ? targetName : `${targetName}.ipxe`;
    bootCommand = `chain ${IPXE_SCRIPT_BASE_URL}/ipxe_scripts/${scriptName}`;
  }
  ipxeScriptLines.push(bootCommand);
  ipxeScriptLines.push('');

  const ipxeScript = ipxeScriptLines.join('\n');

  console.log(`select-api: Selector: "${selectorUsed}" -> TargetScript: "${targetName}", Version: "${version}", Type: "${osType}" (Client IP: ${clientIp}, Requested Hostname: ${hostname || 'N/A'}) -> ${bootCommand}`);

  return new NextResponse(ipxeScript, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}
