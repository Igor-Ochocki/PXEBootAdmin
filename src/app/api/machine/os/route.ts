import { NextResponse, NextRequest } from "next/server";
import { getMachineOperatingSystem, setIpxeConfigByHostname } from "@/lib/utils/db";


export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const stationId = searchParams.get('stationId');

  if (!stationId) {
      return NextResponse.json({ error: 'Station ID is required' }, { status: 400 });
  }

  const os = await getMachineOperatingSystem(stationId);
  return NextResponse.json(os);
}

export async function PUT(request: NextRequest) {
  const { stationId, operatingSystem } = await request.json();
  const [systemCode, subsystemCode] = operatingSystem.split(" ");
  await setIpxeConfigByHostname(stationId, systemCode, subsystemCode, "ipxe");
  return NextResponse.json({ message: 'Operating system set' }, { status: 200 });
}
