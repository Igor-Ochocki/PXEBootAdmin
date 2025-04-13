import { exec } from 'child_process';
import { promisify } from 'util';
import { config } from 'dotenv';
import { initDB } from '@/lib/utils/db';

const execAsync = promisify(exec);

interface ScheduleTaskParams {
  stationId: string;
  startDate: string;
  startTime: string;
  systemCode: string;
}

interface OverlappingScheduleParams {
  stationId: string;
  startDate: string;
  startTime: string;
  duration: string;
}

export async function getOverlappingSchedule({
  stationId,
  startDate,
  startTime,
  duration
}: OverlappingScheduleParams): Promise<boolean> {
  try {
    const db = await initDB();

    // Get all schedules for the given station
    const existingSchedules = await db.all(
      'SELECT startDate, startTime, duration FROM Schedules WHERE stationId = ?',
      [stationId]
    );

    const hours = parseInt(duration.split(':')[0]);
    const minutes = parseInt(duration.split(':')[1]);
    const newStart = new Date(`${startDate} ${startTime}`);
    const newEnd = new Date(newStart.getTime() + (hours * 60 + minutes) * 60000);

    for (const schedule of existingSchedules) {
      const scheduleStart = new Date(`${schedule.startDate} ${schedule.startTime}`);
      const scheduleEnd = new Date(scheduleStart.getTime() + schedule.duration * 60000);

      // Check for overlap
      if (
        (newStart < scheduleEnd && newStart > scheduleStart) || // New schedule starts during existing schedule
        (newEnd > scheduleStart && newEnd < scheduleEnd)    // New schedule ends during existing schedule
      ) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Error checking overlapping schedules:', error);
    throw error;
  }
}

export async function removeScheduleTask({ jobId }: { jobId: number }): Promise<void> {
  try {
    config();
    const command = `atrm ${jobId}`;
    const { stderr } = await execAsync(command);
    if (stderr) {
      console.error('Error removing schedule task:', stderr);
      throw new Error('Failed to remove schedule task');
    }
    console.log(`Schedule task removed successfully with job ID: ${jobId}`);
  } catch (error) {
    console.error('Error in removeScheduleTask:', error);
    throw error;
  }
}

export async function scheduleTask({
  stationId,
  startDate,
  startTime,
  systemCode
}: ScheduleTaskParams): Promise<string> {
  try {
    config();

    // Execute different command based on station status
    const powerOnCommand = `amt-manager powerOn ${stationId} '${process.env.AMT_USERNAME}' '${process.env.AMT_PASSWORD}'`;
    const rebootCommand = `amt-manager reboot ${stationId} '${process.env.AMT_USERNAME}' '${process.env.AMT_PASSWORD}'`;
    const statusCommand = `amt-manager status ${stationId} '${process.env.AMT_USERNAME}' '${process.env.AMT_PASSWORD}'`;
    const computerStatusChange = `${statusCommand} | grep -q 'Power On' && ${powerOnCommand} || ${rebootCommand}`;

    // Construct the command to execute
    const command = `create-station-symlink ${stationId} ${systemCode} && ${computerStatusChange}`;

    // Execute the schedule-task.sh script
    const { stdout, stderr } = await execAsync(
      `./schedule-task -c "${command}" -d ${startDate} -t ${startTime}`
    );

    if (stderr) {
      console.error('Error scheduling task:', stderr);
      throw new Error('Failed to schedule task');
    }

    // Extract the job_id from the output
    const jobIdMatch = stdout.match(/JOB_ID=(\d+)/);
    if (!jobIdMatch) {
      throw new Error('Failed to get job ID from schedule task output');
    }

    const jobId = jobIdMatch[1];
    console.log(`Task scheduled successfully with job ID: ${jobId}`);

    return jobId;
  } catch (error) {
    console.error('Error in scheduleTask:', error);
    throw error;
  }
}
