import { notFoundError, unauthorizedError } from "@/errors";
import { CardData } from "@/protocols";
import paymentsRepository from "@/repositories/payments-repository";
import ticketsRepository from "@/repositories/tickets-repository";
import { Payment } from "@prisma/client";

async function getPaymentByTicket(userId: number, ticketId: number): Promise<Payment> {
  const ticket = await ticketsRepository.findTicketById(ticketId);

  if (!ticket) {
    throw notFoundError();
  }

  if (ticket.Enrollment.User.id !== userId) {
    throw unauthorizedError();
  }

  const payment = await paymentsRepository.findPaymentByTicketId(ticketId);

  if (!payment) {
    throw notFoundError();
  }

  return payment;
}

async function processPayment(userId: number, ticketId: number, cardData: CardData): Promise<Payment> {
  const ticket = await ticketsRepository.findTicketById(ticketId);
  if (!ticket) {
    throw notFoundError();
  }

  if (ticket.Enrollment.User.id !== userId) {
    throw unauthorizedError();
  }

  const createPayment = {
    ticketId,
    value: ticket.TicketType.price,
    cardIssuer: cardData.issuer,
    cardLastDigits: String(cardData.number).slice(-4),
  };

  const payment = await paymentsRepository.createPayment(createPayment);

  await ticketsRepository.updateTicketStatusToPaid(ticketId);

  return payment;
}

const paymentsService = { getPaymentByTicket, processPayment };

export default paymentsService;
