import { isUserAdmin } from "@/utils/userFieldsFetch";
import { NextRequest, NextResponse } from "next/server";
import { addOperatingSystem, getOperatingSystemByCode, deleteOperatingSystem } from "@/lib/utils/db";


export async function PUT(request: NextRequest) {
  const isAdmin = await isUserAdmin(request);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }
  const { name, code } = await request.json();
  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }
  if (!code) {
    return NextResponse.json({ error: 'Code is required' }, { status: 400 });
  }
  const operatingSystem = await getOperatingSystemByCode(code);
  if (operatingSystem) {
    return NextResponse.json({ error: 'Operating system already exists' }, { status: 400 });
  }
  await addOperatingSystem(name, code);
  return NextResponse.json({ message: 'Operating system added successfully' }, { status: 200 });
}

export async function DELETE(request: NextRequest) {
  const isAdmin = await isUserAdmin(request);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }
  const id = request.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'ID is required' }, { status: 400 });
  }
  await deleteOperatingSystem(parseInt(id));
  return NextResponse.json({ message: 'Operating system deleted successfully' }, { status: 200 });
}

