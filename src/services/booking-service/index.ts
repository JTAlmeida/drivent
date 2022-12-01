import { notFoundError } from "@/errors";
import bookingRepository from "@/repositories/booking-repository";
import { exclude } from "@/utils/prisma-utils";
import { Booking, Room } from "@prisma/client";

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

const bookingService = { getBooking };

export default bookingService;
