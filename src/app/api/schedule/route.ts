import { addSchedule } from '@/lib/utils/db';
import { scheduleTask } from '@/utils/scheduleTask';
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

    // Schedule the task and capture job_id
    const jobId = await scheduleTask({
      stationId: data.stationId,
      startDate: data.startDate,
      startTime: data.startTime,
      systemCode: `'${data.operatingSystem} ${data.subSystem}'`
    });

    // Add the schedule to the database
    await addSchedule(data.id, data.stationId, data.startDate, data.startTime, data.duration, data.operatingSystem, data.subSystem, jobId);

    // Return a success response
    return NextResponse.json({
      success: true,
      message: 'Schedule submitted successfully',
      jobId
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
