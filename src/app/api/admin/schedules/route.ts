import { deleteSchedule } from "@/lib/utils/db";
import { NextRequest, NextResponse } from "next/server";
import { isUserAdmin } from "@/utils/userFieldsFetch";
import { syncScheduleWithDatabase } from "@/utils/syncScheduleWithDatabase";
export async function DELETE(request: NextRequest) {
  const isAdmin = await isUserAdmin(request);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }
  const id = parseInt(request.nextUrl.searchParams.get('id') || '0');
  const jobId = parseInt(request.nextUrl.searchParams.get('jobId') || '0');
  if (!id || !jobId) {
    return NextResponse.json({ error: 'Missing id or jobId' }, { status: 400 });
  }
  await deleteSchedule(id, jobId);

  return new NextResponse('Schedule deleted successfully', { status: 200 });
}

export async function POST(request: NextRequest) {
  const isAdmin = await isUserAdmin(request);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }
  try {
    await syncScheduleWithDatabase();
    return new NextResponse('Schedule synced successfully', { status: 200 });
  } catch (error) {
    console.error('Failed to sync schedules:', error);
    return NextResponse.json({ error: 'Failed to sync schedules' }, { status: 500 });
  }
}
