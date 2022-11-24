import hotelsRepository from "@/repositories/hotels-repository";
import ticketsRepository from "@/repositories/tickets-repository";
import { paymentError, forbiddenError } from "@/errors";
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

const hotelsService = { getHotels };

export default hotelsService;
