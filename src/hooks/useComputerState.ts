import { StationData } from '@/utils/getStationsData';
import { useState, useEffect } from 'react';

export function useComputerState(stationId: string) {
  const [state, setState] = useState<StationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchState = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/machine?stationId=${stationId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch computer state');
        }
        const data: StationData = await response.json();
        setState(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch computer state'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchState();
  }, [stationId]);

  return { state, isLoading, error };
}
