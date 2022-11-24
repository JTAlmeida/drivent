import hotelsRepository from "@/repositories/hotels-repository";
import ticketsRepository from "@/repositories/tickets-repository";
import { paymentError, forbiddenError, notFoundError } from "@/errors";
import { Hotel, Room } from "@prisma/client";

async function getHotels(userId: number): Promise<Hotel[]> {
  const ticket = await ticketsRepository.findTicketByUserId(userId);

  if (!ticket || !ticket.TicketType.includesHotel) {
    throw forbiddenError();
  }

  if (ticket.status !== "PAID") {
    throw paymentError();
  }

  const hotels = await hotelsRepository.findHotels();
  return hotels;
}

async function getHotelRooms(hotelId: number): Promise<Room[]> {
  const hotel = await hotelsRepository.findHotelById(hotelId);

  if (!hotel) {
    throw notFoundError();
  }

  const hotelRooms = await hotelsRepository.findHotelRooms(hotelId);

  return hotelRooms;
}

const hotelsService = { getHotels, getHotelRooms };

export default hotelsService;
