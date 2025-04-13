import { getOperatingSubsystemByCode, deleteOperatingSubsystem, addOperatingSubsystem } from "@/lib/utils/db";
import { isUserAdmin } from "@/utils/userFieldsFetch";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(request: NextRequest) {
  const isAdmin = await isUserAdmin(request);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }
  const id = request.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'ID is required' }, { status: 400 });
  }
  await deleteOperatingSubsystem(parseInt(id));
  return NextResponse.json({ message: 'Subsystem deleted successfully' }, { status: 200 });
}

export async function PUT(request: NextRequest) {
  const isAdmin = await isUserAdmin(request);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }
  const { code, name, operatingSystemId } = await request.json();
  if (!code) {
    return NextResponse.json({ error: 'Code is required' }, { status: 400 });
  }
  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }
  if (!operatingSystemId) {
    return NextResponse.json({ error: 'Operating system ID is required' }, { status: 400 });
  }
  const operatingSubsystem = await getOperatingSubsystemByCode(code, parseInt(operatingSystemId));
  if (operatingSubsystem) {
    return NextResponse.json({ error: 'Subsystem already exists' }, { status: 400 });
  }
  await addOperatingSubsystem(code, name, parseInt(operatingSystemId));
  return NextResponse.json({ message: 'Subsystem added successfully' }, { status: 200 });
}

