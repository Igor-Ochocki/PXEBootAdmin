import { useState } from 'react';
import { useSchedules } from '@/hooks/useSchedules';
import { format, parseISO, addMinutes, startOfWeek, addDays, addWeeks, subWeeks } from 'date-fns';

interface ScheduleCalendarProps {
  stationId: string;
  onClose?: () => void;
}

interface ScheduleBlock {
  start: Date;
  end: Date;
  operatingSystemName: string;
  subSystemName: string | null;
}

export function ScheduleCalendar({ stationId, onClose }: ScheduleCalendarProps) {
  const [currentWeek, setCurrentWeek] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const { schedules, loading, error } = useSchedules({
    stationId: `s${stationId}`,
    startDate: format(currentWeek, 'yyyy-MM-dd')
  });

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i));

  // Generate time slots from 00:00 to 23:00
  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    return `${i.toString().padStart(2, '0')}:00`;
  });

  const renderDayHeader = (date: Date) => {
    return (
      <div className="p-2 border-b text-center font-medium bg-primary">
        <div className="text-sm text-quinary">{format(date, 'EEE')}</div>
        <div className="text-quinary">{format(date, 'd')}</div>
      </div>
    );
  };

  const getScheduleBlocks = (date: Date) => {
    const daySchedules = schedules.filter(schedule => {
      const scheduleDate = parseISO(schedule.startDate);
      const scheduleEndDate = addMinutes(parseISO(`${schedule.startDate}T${schedule.startTime}`), schedule.duration);

      // Include schedules that start on this day or end on this day
      return format(scheduleDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd') ||
             format(scheduleEndDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
    });

    return daySchedules.map(schedule => {
      const start = parseISO(`${schedule.startDate}T${schedule.startTime}`);
      const end = addMinutes(start, schedule.duration);
      const startHour = start.getHours();
      const startMinutes = start.getMinutes();
      const durationHours = schedule.duration / 60;

      // Calculate if the schedule spans to the next day
      const isOvernight = format(start, 'yyyy-MM-dd') !== format(end, 'yyyy-MM-dd');
      const isStartDay = format(start, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');

      let top = '0';
      let height = '0';

      if (isStartDay) {
        // For the start day, position from the start time to midnight
        top = `${(startHour + startMinutes / 60) * 4}rem`;
        if (isOvernight) {
          // If it's overnight, extend to midnight
          height = `${(24 - (startHour + startMinutes / 60)) * 4}rem`;
        } else {
          // If it's same day, use the full duration
          height = `${durationHours * 4}rem`;
        }
      } else {
        // For the end day, position from midnight to the end time
        top = '0';
        const endHour = end.getHours();
        const endMinutes = end.getMinutes();
        height = `${(endHour + endMinutes / 60) * 4}rem`;
      }

      return {
        start,
        end,
        operatingSystemName: schedule.operatingSystemName,
        subSystemName: schedule.subSystemName,
        top,
        height,
        isOvernight,
        isStartDay
      };
    });
  };

  const renderScheduleBlock = (block: ScheduleBlock & { top: string; height: string; isOvernight: boolean; isStartDay: boolean }) => {
    const startTime = format(block.start, 'HH:mm');
    const endTime = format(block.end, 'HH:mm');

    return (
      <div
        key={block.start.toISOString()}
        className="absolute left-0 right-0 mx-1 p-2 bg-secondary rounded border border-quaternary"
        style={{
          top: block.top,
          height: block.height
        }}
      >
        <div className="text-sm font-medium text-quinary">
          {block.isStartDay ? startTime : '00:00'} - {block.isStartDay ? (block.isOvernight ? '24:00' : endTime) : endTime}
        </div>
        <div className="text-xs text-quinary">
          {block.operatingSystemName}
          {block.subSystemName && ` - ${block.subSystemName}`}
        </div>
      </div>
    );
  };

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute bg-primary rounded-xl shadow-xl w-screen max-w-[95vw] max-h-[90vh] overflow-hidden p-2">
        {/* Header */}
        <div className="p-4 border-b border-quaternary flex justify-between items-center bg-primary sticky top-0 z-20">
          <button
            onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
            className="px-4 py-2 border border-quaternary rounded-full text-quinary hover:bg-secondary transition-colors duration-300"
          >
            Previous Week
          </button>
          <div className="flex flex-col items-center gap-2 h-full overflow-auto no-scrollbar">
            <h2 className="text-lg font-semibold text-quinary">
              {format(currentWeek, 'MMMM yyyy')}
            </h2>
            {loading && <div className="text-quinary">Loading...</div>}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
              className="px-4 py-2 border border-quaternary rounded-full text-quinary hover:bg-secondary transition-colors duration-300"
            >
              Next Week
            </button>
            <button
              onClick={onClose}
              className="p-2 border border-quaternary rounded-full text-quinary hover:bg-secondary transition-colors duration-300"
              aria-label="Close calendar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        {/* Calendar Container */}
        <div className="overflow-auto h-[calc(90vh-4rem)] no-scrollbar">
          <div className="flex min-h-full">
            {/* Timeline */}
            <div className="w-24 flex-shrink-0 border-r border-quaternary bg-primary">
              <div className="h-12 border-b border-quaternary sticky top-0 z-10 bg-primary" />
              <div className="divide-y divide-quaternary">
                {timeSlots.map((time) => (
                  <div key={time} className="h-16 p-2 text-xs text-quinary">
                    {time}
                  </div>
                ))}
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1">
              <div className="grid grid-cols-7 divide-x divide-quaternary w-full">
                {weekDays.map((day) => (
                  <div key={day.toISOString()} className="flex flex-col">
                    <div className="sticky top-0 z-10 bg-primary">
                      {renderDayHeader(day)}
                    </div>
                    <div className="relative p-2 min-h-[96rem] bg-primary">
                      {getScheduleBlocks(day).map(renderScheduleBlock)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
