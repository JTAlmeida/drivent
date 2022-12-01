import faker from "@faker-js/faker";
import { prisma } from "@/config";
import { Room } from "@prisma/client";

export async function createRoom(params: Partial<Room> = {}): Promise<Room> {
  return prisma.room.create({
    data: {
      name: params.name || faker.name.findName(),
      capacity: params.capacity || faker.datatype.number(),
      hotelId: params.hotelId,
    },
  });
}
