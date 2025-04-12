import { exec } from 'child_process';
import { promisify } from 'util';
import { config } from 'dotenv';

const execAsync = promisify(exec);

interface ScheduleTaskParams {
  stationId: string;
  startDate: string;
  startTime: string;
  systemCode: string;
}

export async function scheduleTask({
  stationId,
  startDate,
  startTime,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  systemCode
}: ScheduleTaskParams): Promise<string> {
  try {
    config();
    // Construct the command to execute
    const command = `echo "amt-manager powerOn ${stationId} ${process.env.AMT_USERNAME} ${process.env.AMT_PASSWORD}" > /tmp/test`;

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

    // // Schedule the power off command after the duration
    // const powerOffTime = new Date(`${startDate}T${startTime}`);
    // powerOffTime.setMinutes(powerOffTime.getMinutes() + duration);

    // const powerOffDate = powerOffTime.toISOString().split('T')[0];
    // const powerOffTimeStr = powerOffTime.toTimeString().slice(0, 5);

    // const powerOffCommand = `node src/scripts/power-control.js ${stationId} powerOff`;
    // const { stdout: powerOffStdout, stderr: powerOffStderr } = await execAsync(
    //   `./schedule-task.sh -c "${powerOffCommand}" -d ${powerOffDate} -t ${powerOffTimeStr}`
    // );

    // if (powerOffStderr) {
    //   console.error('Error scheduling power off task:', powerOffStderr);
    //   throw new Error('Failed to schedule power off task');
    // }

    // const powerOffJobIdMatch = powerOffStdout.match(/JOB_ID=(\d+)/);
    // if (!powerOffJobIdMatch) {
    //   throw new Error('Failed to get power off job ID from schedule task output');
    // }

    // const powerOffJobId = powerOffJobIdMatch[1];
    // console.log(`Power off task scheduled successfully with job ID: ${powerOffJobId}`);

    return jobId;
  } catch (error) {
    console.error('Error in scheduleTask:', error);
    throw error;
  }
}
