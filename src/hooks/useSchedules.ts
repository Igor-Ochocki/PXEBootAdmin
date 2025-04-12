import { useState, useEffect } from 'react';

interface Schedule {
  id: string;
  stationId: string;
  startDate: string;
  startTime: string;
  duration: number;
  operatingSystemName: string;
  operatingSystemCode: string;
  subSystemName: string | null;
}

interface UseSchedulesProps {
  stationId?: string;
  startDate?: string;
}

export function useSchedules({ stationId, startDate }: UseSchedulesProps = {}) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (stationId) params.append('stationId', stationId);
        if (startDate) params.append('startDate', startDate);

        const response = await fetch(`/api/schedules?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch schedules');
        }

        const data = await response.json();
        setSchedules(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setSchedules([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedules();
  }, [stationId, startDate]);

  return { schedules, loading, error };
}
