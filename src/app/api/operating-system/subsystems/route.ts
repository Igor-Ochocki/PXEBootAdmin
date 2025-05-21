import { NextRequest, NextResponse } from 'next/server';
import { initDB } from '@/lib/utils/db';
import { getUserStatus } from '@/utils/userFieldsFetch';

export async function GET(request: NextRequest) {
  try {
    const userStatus = await getUserStatus(request);
    if (userStatus.status !== 200) {
      return NextResponse.json(
        { error: 'User is not an active student' },
        { status: 403 }
      );
    }

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
