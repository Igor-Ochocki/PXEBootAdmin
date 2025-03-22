#!/usr/bin/env node
import { AmtClient } from '../utils/amtClient';
import { RCC, RCCS, RCCS_OEM } from '../utils/amtTypes';

function printUsage() {
  console.error(`
This utility can talk to Intel AMT managed machines.

usage: amttool <hostname> [ <command> ] [ <arg(s)> ]
commands:
   info            - print some machine info (default).
   reset           - reset machine.
   powerup         - turn on machine.
   powerdown       - turn off machine.
   powercycle      - powercycle machine.

AMT 2.5+ only:
   netinfo         - print network config.
   netconf <args>  - configure network (check manpage).

Password is passed via AMT_PASSWORD environment variable.
`);
}

async function main() {
  const [,, host, command = 'info', ...args] = process.argv;

  if (!host) {
    printUsage();
    process.exit(1);
  }

  // Parse host and port
  let amtHost = host;
  let amtPort = 16992;
  let amtProtocol: 'http' | 'https' = 'http';

  const hostMatch = host.match(/([^:]+):(\d+)/);
  if (hostMatch) {
    amtHost = hostMatch[1];
    amtPort = parseInt(hostMatch[2]);
    if (amtPort === 16993) {
      amtProtocol = 'https';
    }
  }

  // Get credentials from environment
  const username = process.env.AMT_USER || 'admin';
  const password = process.env.AMT_PASSWORD;
  const debug = process.env.AMT_DEBUG === '1';

  if (!password) {
    console.error('Error: AMT_PASSWORD environment variable must be set');
    process.exit(1);
  }

  // Create AMT client
  const client = new AmtClient({
    host: amtHost,
    port: amtPort,
    protocol: amtProtocol,
    username,
    password,
    debug,
  });

  try {
    switch (command) {
      case 'info':
        await client.getInfo();
        break;

      case 'reset':
      case 'powerup':
      case 'powerdown':
      case 'powercycle':
        if (command in RCC) {
          const specialArg = args[0] as keyof typeof RCCS | keyof typeof RCCS_OEM | undefined;
          if (specialArg && !(specialArg in RCCS) && !(specialArg in RCCS_OEM)) {
            console.error(`Invalid special command: ${specialArg}`);
            process.exit(1);
          }
          await client.remoteControl(command as keyof typeof RCC, specialArg);
        }
        break;

      default:
        console.error(`Unknown command: ${command}`);
        printUsage();
        process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main().catch(console.error);
