import { NextRequest, NextResponse } from 'next/server';
import { getAdmins, addAdmin, removeAdmin } from '@/lib/utils/db';
import { isUserAdmin } from '@/utils/userFieldsFetch';
export async function GET() {
  try {
    const admins = await getAdmins();
    return NextResponse.json(admins);
  } catch (error) {
    console.error('Error fetching admins:', error);
    return NextResponse.json({ error: 'Failed to fetch admins' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const isAdmin = await isUserAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }
    const id = request.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Admin ID is required' }, { status: 400 });
    }
    await removeAdmin(id);
    return NextResponse.json({ message: 'Admin deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting admin:', error);
    return NextResponse.json({ error: 'Failed to delete admin' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const isAdmin = await isUserAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }
    const {id} = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'Admin ID is required' }, { status: 400 });
    }
    console.log(id);
    await addAdmin(id);
    return NextResponse.json({ message: 'Admin updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error updating admin:', error);
    return NextResponse.json({ error: 'Failed to update admin' }, { status: 500 });
  }
}