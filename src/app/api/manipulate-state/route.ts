import { AMTManager } from 'amt-manager-test';
import { NextResponse } from 'next/server';
import { config } from 'dotenv';

export async function POST(request: Request) {
  try {
    config();
    const { stationId, action } = await request.json();

    console.log(stationId, action);

    if (!stationId || !action) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Get station configuration from environment variables or a configuration file
    const stationConfig = {
      host: `s${stationId}`,
      username: process.env.AMT_USERNAME || 'admin',
      password: process.env.AMT_PASSWORD || 'password',
      port: parseInt(process.env.AMT_PORT || '16992'),
      protocol: 'http' as const,
    };

    if (!stationConfig.host || !stationConfig.username || !stationConfig.password) {
      return NextResponse.json(
        { error: 'Missing station configuration' },
        { status: 400 }
      );
    }

    const amtManager = new AMTManager(stationConfig);
    let result;

    switch (action) {
      case 'powerOn':
        result = await amtManager.powerOn();
        break;
      case 'powerOff':
        result = await amtManager.powerOff();
        break;
      case 'reset':
        result = await amtManager.reset();
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: result });
  } catch (error) {
    console.error('Error in manipulate-state:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
