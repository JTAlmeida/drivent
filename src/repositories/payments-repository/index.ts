import { prisma } from "@/config";
import { CreatePayment } from "@/protocols";

async function findPaymentByTicketId(ticketId: number) {
  return prisma.payment.findFirst({
    where: {
      ticketId,
    },
  });
}

async function createPayment(data: CreatePayment) {
  return prisma.payment.create({ data });
}

const paymentsRepository = { findPaymentByTicketId, createPayment };

export default paymentsRepository;
