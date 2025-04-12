import { NextResponse, NextRequest } from "next/server";
import { getMachineOperatingSystem } from "@/utils/getMachineOperatingSystem";


export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const stationId = searchParams.get('stationId');

  if (!stationId) {
      return NextResponse.json({ error: 'Station ID is required' }, { status: 400 });
  }

  const os = await getMachineOperatingSystem(stationId);
  return NextResponse.json(os);
}
