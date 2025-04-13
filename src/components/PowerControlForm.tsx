import { useState } from 'react';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { PowerSettingsNew, PowerOff, Refresh, Close } from '@mui/icons-material';
import { ScheduleCalendarAdmin } from './calendar/ScheduleCalendarAdmin';

interface PowerControlFormProps {
  stationId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function PowerControlForm({ stationId, isOpen, onClose }: PowerControlFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const handlePowerAction = async (action: 'powerOn' | 'powerOff' | 'reset') => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/manipulate-state', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stationId,
          action,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to execute power action');
      }

      const result = await response.json();
      console.log(`${action} result:`, result);
      onClose();
    } catch (error) {
      console.error('Error executing power action:', error);
      // You might want to show an error message to the user here
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <DialogTitle>Power Control - Station {stationId}</DialogTitle>
      <DialogContent>
        <div className="flex flex-col gap-4 p-4">
          <Button
            variant="contained"
            color="success"
            startIcon={<PowerSettingsNew />}
            onClick={() => handlePowerAction('powerOn')}
            disabled={isLoading}
            fullWidth
          >
            Power On
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<PowerOff />}
            onClick={() => handlePowerAction('powerOff')}
            disabled={isLoading}
            fullWidth
          >
            Power Off
          </Button>
          <Button
            variant="contained"
            color="warning"
            startIcon={<Refresh />}
            onClick={() => handlePowerAction('reset')}
            disabled={isLoading}
            fullWidth
          >
            Reset
          </Button>
          <div>
            <div className="w-full flex justify-center">
              <Button
                variant="outlined"
                type="button"
                onClick={() => setShowCalendar(!showCalendar)}
                className={`border border-quaternary rounded-full px-4 py-2
                          transition-all duration-300 ease-in-out
                          hover:bg-blue-500 hover:text-white hover:border-blue-500
                          active:bg-blue-700 active:scale-95
                          ${showCalendar ? 'bg-blue-500 text-white' : 'text-blue-500'}`}
              >
                {showCalendar ? 'Hide Schedule' : 'View Schedule'}
              </Button>
            </div>

            {showCalendar && (
              <ScheduleCalendarAdmin
                stationId={stationId}
                onClose={() => setShowCalendar(false)}
              />
            )}
          </div>
        </div>
      </DialogContent>
      <DialogActions>
        <Button
          variant="outlined"
          startIcon={<Close />}
          onClick={onClose}
          disabled={isLoading}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
