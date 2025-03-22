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

    // Log the data to the server console
    console.log('Schedule form submission received:');
    console.log('Station ID:', data.stationId);
    console.log('Start Date:', data.startDate);
    console.log('Start Time:', data.startTime);
    console.log('Duration:', data.duration);
    console.log('Operating System:', data.operatingSystem);
    console.log('User ID:', data.id);
    console.log('-----------------------------------');

    // TODO: Add your scheduling logic here
    // For example, saving to a database, checking for conflicts, etc.

    // Return a success response
    return NextResponse.json({
      success: true,
      message: 'Schedule submitted successfully'
    });
  } catch (error) {
    console.error('Error processing schedule submission:', error);

    // Return an error response
    return NextResponse.json(
      { success: false, message: 'Failed to process schedule submission' },
      { status: 500 }
    );
  }
}
