import { initDB } from '@/lib/utils/db';

export async function populateTestSchedules() {
  const db = await initDB();

  try {
    await db.exec(`
      DELETE FROM Schedules;
    `);
    // Get current date
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    // Test schedules
    const testSchedules = [
      // Today's schedules
      {
        stationId: 's1',
        userId: 'u1',
        startDate: formatDate(today),
        startTime: '09:00',
        duration: 60, // 1 hour
        operatingSystem: 'linux-ubuntu',
        subSystem: 'ubuntu-desktop',
        jobId: 'j1'
      },
      {
        stationId: 's1',
        userId: 'u1',
        startDate: formatDate(today),
        startTime: '23:00',
        duration: 360, // 6 hours
        operatingSystem: 'linux-ubuntu',
        subSystem: 'ubuntu-desktop',
        jobId: 'j1'
      },
      {
        stationId: 's1',
        userId: 'u1',
        startDate: formatDate(today),
        startTime: '11:00',
        duration: 120, // 2 hours
        operatingSystem: 'linux-arch',
        subSystem: 'arch-desktop',
        jobId: 'j1'
      },
      {
        stationId: 's1',
        userId: 'u1',
        startDate: formatDate(today),
        startTime: '14:00',
        duration: 90, // 1.5 hours
        operatingSystem: 'linux-ubuntu',
        subSystem: 'ubuntu-server',
        jobId: 'j1'
      },
      // Tomorrow's schedules
      {
        stationId: 's1',
        userId: 'u1',
        startDate: formatDate(tomorrow),
        startTime: '10:00',
        duration: 120,
        operatingSystem: 'linux-arch',
        subSystem: 'arch-desktop',
        jobId: 'j1'
      },
      {
        stationId: 's1',
        userId: 'u1',
        startDate: formatDate(tomorrow),
        startTime: '13:00',
        duration: 60,
        operatingSystem: 'linux-ubuntu',
        subSystem: 'ubuntu-desktop',
        jobId: 'j1'
      },
      // Next week's schedules
      {
        stationId: 's1',
        userId: 'u1',
        startDate: formatDate(nextWeek),
        startTime: '09:00',
        duration: 180, // 3 hours
        operatingSystem: 'linux-arch',
        subSystem: 'arch-server',
        jobId: 'j1'
      },
      {
        stationId: 's1',
        userId: 'u1',
        startDate: formatDate(nextWeek),
        startTime: '14:00',
        duration: 120,
        operatingSystem: 'linux-ubuntu',
        subSystem: 'ubuntu-desktop',
        jobId: 'j1'
      }
    ];

    // Insert test schedules
    for (const schedule of testSchedules) {
      await db.run(
        `INSERT INTO Schedules (
          stationId, userId, startDate, startTime, duration,
          operatingSystem, subSystem, jobId
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          schedule.stationId,
          schedule.userId,
          schedule.startDate,
          schedule.startTime,
          schedule.duration,
          schedule.operatingSystem,
          schedule.subSystem,
          schedule.jobId
        ]
      );
    }

    console.log('Test schedules populated successfully!');
  } catch (error) {
    console.error('Error populating test schedules:', error);
  } finally {
    await db.close();
  }
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}
