import { NextRequest, NextResponse } from 'next/server';
import { initDB } from '@/lib/utils/db';

export async function GET(request: NextRequest) {
  try {
    const db = await initDB();
    const { searchParams } = new URL(request.url);
    const os = searchParams.get('os');
    const subsystems = await db.all(
      'SELECT * FROM SubSystems WHERE operatingSystemId = (SELECT id FROM OperatingSystems WHERE code = ?)',
      [os]
    );
    await db.close();
    return NextResponse.json(subsystems);
  } catch (error) {
    console.error('Error fetching subsystems:', error);
    return NextResponse.json({ error: 'Failed to fetch subsystems' }, { status: 500 });
  }
}
