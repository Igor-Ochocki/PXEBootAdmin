import { NextRequest, NextResponse } from 'next/server';
import { initDB } from '@/lib/utils/db';
// import { populateTestSchedules } from '@/scripts/populate-test-schedules';
export async function GET(request: NextRequest) {
  try {
    const db = await initDB();

    // await populateTestSchedules();

    // Get query parameters
    const url = new URL(request.url);
    const stationId = url.searchParams.get('stationId');
    const startDate = url.searchParams.get('startDate');

    let query = `
      SELECT
        s.*,
        os.name as operatingSystemName,
        os.code as operatingSystemCode,
        ss.name as subSystemName
      FROM Schedules s
      LEFT JOIN OperatingSystems os ON s.operatingSystem = os.code
      LEFT JOIN SubSystems ss ON s.subSystem = ss.code
    `;

    const params = [];

    if (stationId) {
      query += ' WHERE s.stationId = ?';
      params.push(stationId);
    }

    if (startDate) {
      query += stationId ? ' AND' : ' WHERE';
      query += ' s.startDate >= ?';
      params.push(startDate);
    }

    query += ' ORDER BY s.startDate, s.startTime';

    const schedules = await db.all(query, params);
    await db.close();

    return NextResponse.json(schedules);
  } catch (error) {
    console.error('Error fetching schedules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schedules' },
      { status: 500 }
    );
  }
}
