import { NextRequest, NextResponse } from 'next/server';
import { initDB } from '@/lib/utils/db';
import { revalidatePath } from 'next/cache';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET() {
    try {
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
    const { stationId, operatingSystem, subSystem } = await request.json();

    const command = `create-station-symlink ${stationId} '${operatingSystem} ${subSystem}'`;
    await execAsync(command);
    revalidatePath(`/`);
    return NextResponse.json({ message: 'Operating system updated' });
}