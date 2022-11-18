import ticketsRepository from "@/repositories/tickets-repository";
import { Ticket, TicketType } from "@prisma/client";

async function getTicketTypes(): Promise<TicketType[]> {
  return await ticketsRepository.findTicketTypes();
}

const ticketsService = { getTicketTypes };

export default ticketsService;
