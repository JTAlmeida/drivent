import { prisma } from "@/config";

async function findBookingByUserId(userId: number) {
  return prisma.booking.findFirst({
    where: {
      userId,
    },
    include: {
      Room: true,
    },
  });
}

async function createBooking(userId: number, roomId: number) {
  return prisma.booking.create({
    data: {
      userId,
      roomId,
    },
  });
}

async function findBookingByRoomId(roomId: number) {
  return prisma.booking.findMany({
    where: {
      roomId,
    },
  });
}

async function findBookingById(id: number) {
  return prisma.booking.findUnique({
    where: {
      id,
    },
    include: {
      Room: true,
    },
  });
}

async function updateBooking(id: number, roomId: number) {
  return prisma.booking.update({
    where: { id },
    data: { roomId },
  });
}

const bookingRepository = { findBookingByUserId, createBooking, findBookingByRoomId, findBookingById, updateBooking };

export default bookingRepository;
