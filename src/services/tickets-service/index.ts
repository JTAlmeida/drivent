import { notFoundError } from "@/errors";
import { getTicketResult } from "@/protocols";
import ticketsRepository from "@/repositories/tickets-repository";
import userRepository from "@/repositories/user-repository";
import { exclude } from "@/utils/prisma-utils";
import { TicketType } from "@prisma/client";

async function getTicketTypes(): Promise<TicketType[]> {
  return await ticketsRepository.findTicketTypes();
}

async function getTicket(userId: number): Promise<getTicketResult> {
  const user = userRepository.findById(userId);
  if (!user) {
    throw notFoundError();
  }

  const ticket = await ticketsRepository.findTicketByUserId(userId);
  if (!ticket) {
    throw notFoundError();
  }

  return {
    ...exclude(ticket, "Enrollment"),
  };
}

const ticketsService = { getTicketTypes, getTicket };

export default ticketsService;
