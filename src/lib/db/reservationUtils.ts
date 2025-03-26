import { getUserByUsosId, createReservation, getStationReservationsForDate } from './operations';

interface CreateReservationParams {
  usosId: number;
  stationId: number;
  startTime: Date;
  duration: number;
}

interface Reservation {
  start_time: string;
  duration: number;
}

interface User {
  id: number;
}

export async function createReservationWithUsosId({
  usosId,
  stationId,
  startTime,
  duration,
}: CreateReservationParams) {
  // Get user by USOS ID
  const user = getUserByUsosId.get(usosId) as User | undefined;

  if (!user) {
    throw new Error(`User with USOS ID ${usosId} not found`);
  }

  // Check for existing reservations at the same time
  const existingReservations = getStationReservationsForDate.all(stationId, startTime.toISOString()) as Reservation[];

  // Check for overlapping reservations
  const hasOverlap = existingReservations.some(reservation => {
    const reservationStart = new Date(reservation.start_time);
    const reservationEnd = new Date(reservationStart.getTime() + reservation.duration * 60000);
    const newReservationEnd = new Date(startTime.getTime() + duration * 60000);

    return (
      (startTime >= reservationStart && startTime < reservationEnd) ||
      (newReservationEnd > reservationStart && newReservationEnd <= reservationEnd) ||
      (startTime <= reservationStart && newReservationEnd >= reservationEnd)
    );
  });

  if (hasOverlap) {
    throw new Error('Time slot is already reserved');
  }

  // Create the reservation
  const result = createReservation.run(
    user.id,
    stationId,
    startTime.toISOString(),
    duration
  );

  return result;
}

export function getReservationsForDate(stationId: number, date: Date) {
  return getStationReservationsForDate.all(stationId, date.toISOString());
}
