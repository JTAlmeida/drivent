import { prisma } from "@/config";
import { Booking } from "@prisma/client";

export async function createBooking(params: { userId: number; roomId: number }): Promise<Booking> {
  return prisma.booking.create({
    data: {
      userId: params.userId,
      roomId: params.roomId,
    },
  });
}
