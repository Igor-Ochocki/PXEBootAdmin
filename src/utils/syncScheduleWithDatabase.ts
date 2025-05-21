import { initDB, updateScheduleJobId } from "@/lib/utils/db";
import { promisify } from "util";
import { exec } from "child_process";
import { scheduleTask } from "./scheduleTask";

const execAsync = promisify(exec);

interface Schedule {
  id: number
  stationId: string;
  startDate: string;
  startTime: string;
  operatingSystem: string;
  subSystem: string;
}

export async function syncScheduleWithDatabase() {
  try {
    const db = await initDB();
    const furtherSchedules: Schedule[] = await db.all('SELECT id, stationId, startDate, startTime, operatingSystem, subSystem FROM Schedules WHERE startDate >= ?', [new Date().toISOString().split('T')[0]]);
    const {stdout} = await execAsync(`ls -p | grep executed || true`);
    if(stdout.includes('executed')) {
      return;
    }
    await execAsync(`sudo touch executed`);
    await execAsync(`sudo atq | awk '{print $1}' | xargs -r atrm`);

    for (const schedule of furtherSchedules) {
      const { id, stationId, startDate, startTime, operatingSystem, subSystem } = schedule;
      const systemCode = `${operatingSystem} ${subSystem}`;
      const jobId = await scheduleTask({
        stationId,
        startDate,
        startTime,
        systemCode
      });

      await updateScheduleJobId(id, jobId);
    }
  } catch (error) {
    console.error('Error syncing schedules:', error);
  }
}