import { forbiddenError, notFoundError } from "@/errors";
import bookingRepository from "@/repositories/booking-repository";
import ticketsRepository from "@/repositories/tickets-repository";
import roomsRepository from "@/repositories/rooms-repository";
import { exclude } from "@/utils/prisma-utils";
import { Booking, Room, TicketStatus } from "@prisma/client";

async function getBooking(userId: number): Promise<getBookingResult> {
  const booking = await bookingRepository.findBookingByUserId(userId);

  if (!booking) {
    throw notFoundError();
  }

  return {
    ...exclude(booking, "createdAt", "updatedAt", "userId", "roomId"),
    Room: { ...exclude(booking.Room, "createdAt", "updatedAt") },
  };
}

type getBookingResult = Omit<Booking, "userId" | "roomId" | "createdAt" | "updatedAt"> & {
  Room: Omit<Room, "createdAt" | "updatedAt">;
};

async function createBooking(userId: number, roomId: number): Promise<Booking> {
  const ticket = await ticketsRepository.findTicketByUserId(userId);

  if (
    !ticket ||
    !ticket.TicketType.includesHotel ||
    ticket.status !== TicketStatus.PAID ||
    ticket.TicketType.isRemote
  ) {
    throw forbiddenError();
  }

  const room = await roomsRepository.findRoomById(roomId);
  if (!room) {
    throw notFoundError();
  }

  const userHasBooking = await bookingRepository.findBookingByUserId(userId);
  if (userHasBooking) {
    throw forbiddenError();
  }

  const checkRoomBookings = await bookingRepository.findBookingByRoomId(roomId);
  if (checkRoomBookings.length >= room.capacity) {
    throw forbiddenError();
  }

  const booking = await bookingRepository.createBooking(userId, roomId);
  return booking;
}

const bookingService = { getBooking, createBooking };

export default bookingService;
