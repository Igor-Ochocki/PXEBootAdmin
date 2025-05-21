import { NextRequest, NextResponse } from 'next/server';
import { initDB, setIpxeConfigByHostname } from '@/lib/utils/db';
import { revalidatePath } from 'next/cache';
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
        const operatingSystems = await db.all('SELECT * FROM OperatingSystems');
        await db.close();
        return NextResponse.json(operatingSystems);
    } catch (error) {
        console.error('Error fetching operating systems:', error);
        return NextResponse.json({ error: 'Failed to fetch operating systems' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const userStatus = await getUserStatus(request);
        if (userStatus.status !== 200) {
            return NextResponse.json(
                { error: 'User is not an active student' },
                { status: 403 }
            );
        }

        const { stationId, operatingSystem, subSystem = '', type = '' } = await request.json();
        await setIpxeConfigByHostname(stationId, operatingSystem, subSystem, type);
        revalidatePath(`/`);
        return NextResponse.json({ message: 'Operating system updated' });
    } catch (error) {
        console.error('Error updating operating system:', error);
        return NextResponse.json({ error: 'Failed to update operating system' }, { status: 500 });
    }
}
