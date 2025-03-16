import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const data = await request.json();

    // Log the data to the server console
    console.log('Schedule form submission received:');
    console.log('Station ID:', data.stationId);
    console.log('Start Date:', data.startDate);
    console.log('Start Time:', data.startTime);
    console.log('End Date:', data.endDate);
    console.log('End Time:', data.endTime);
    console.log('Operating System:', data.operatingSystem);
    console.log('-----------------------------------');

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
