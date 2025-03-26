import { createReservationWithUsosId } from '@/lib/db/reservationUtils';
import { executeScript } from '@/lib/utils/scriptExecutor';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('access_token')?.value;
    const accessTokenSecret = request.cookies.get('access_token_secret')?.value;

    if (!accessToken || !accessTokenSecret) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Parse the request body
    const data = await request.json();

    // Validate required fields
    const requiredFields = ['stationId', 'startDate', 'startTime', 'duration', 'operatingSystem', 'id'];
    const missingFields = requiredFields.filter(field => !data[field]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Missing required fields: ${missingFields.join(', ')}`
        },
        { status: 400 }
      );
    }

    // Combine start date and time into a single datetime
    const startDateTime = new Date(`${data.startDate}T${data.startTime}`);

    // Create the reservation
    const reservation = await createReservationWithUsosId({
      usosId: data.id,
      stationId: data.stationId,
      startTime: startDateTime,
      duration: data.duration
    });

    // Handle reservation execution on system
    await executeScript(`echo "amttool ${data.stationId} poweron | at ${startDateTime.toISOString()}" > ~/schedule`);

    // Return a success response with the created reservation
    return NextResponse.json({
      success: true,
      message: 'Reservation created successfully',
      data: reservation
    });
  } catch (error) {
    console.error('Error processing schedule submission:', error);

    // Return an error response
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to process schedule submission'
      },
      { status: 500 }
    );
  }
}
