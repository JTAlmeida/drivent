import { prisma } from "@/config";

async function findTicketTypes() {
  return prisma.ticketType.findMany();
}

const ticketsRepository = { findTicketTypes };

export default ticketsRepository;
