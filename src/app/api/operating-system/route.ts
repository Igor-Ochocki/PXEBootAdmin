import { NextResponse } from 'next/server';
import { initDB } from '@/lib/utils/db';

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