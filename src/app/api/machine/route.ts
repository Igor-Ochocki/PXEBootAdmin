import { NextResponse } from 'next/server';
import { getComputerState } from '@/utils/getStationsData';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const stationId = searchParams.get('stationId');

    if (!stationId) {
      return NextResponse.json(
        { error: 'Station ID is required' },
        { status: 400 }
      );
    }

    const state = await getComputerState(stationId);
    return NextResponse.json(state);
  } catch (error) {
    console.error('Error fetching computer state:', error);
    return NextResponse.json(
      { error: 'Failed to fetch computer state' },
      { status: 500 }
    );
  }
}
