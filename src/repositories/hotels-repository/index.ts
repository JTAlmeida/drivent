import { prisma } from "@/config";

async function findHotels() {
  return prisma.hotel.findMany();
}

async function findHotelById(id: number) {
  return prisma.hotel.findUnique({
    where: { id },
  });
}

async function findHotelRooms(hotelId: number) {
  return prisma.room.findMany({
    where: {
      hotelId,
    },
  });
}

const hotelsRepository = { findHotels, findHotelById, findHotelRooms };

export default hotelsRepository;
