import { badRequestError, notFoundError } from "@/errors";
import { createTicketResult, getTicketResult } from "@/protocols";
import enrollmentRepository from "@/repositories/enrollment-repository";
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

async function createTicket(userId: number, ticketTypeId: number): Promise<createTicketResult> {
  const user = userRepository.findById(userId);

  if (!ticketTypeId) {
    throw badRequestError();
  }

  if (!user) {
    throw notFoundError();
  }

  const enrollment = await enrollmentRepository.findWithAddressByUserId(userId);
  if (!enrollment) {
    throw notFoundError();
  }

  return await ticketsRepository.createTicket(ticketTypeId, enrollment.id);
}

const ticketsService = { getTicketTypes, getTicket, createTicket };

export default ticketsService;
