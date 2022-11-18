import { prisma } from "@/config";

async function findTicketTypes() {
  return prisma.ticketType.findMany();
}

async function findTicketByUserId(userId: number) {
  return prisma.ticket.findFirst({
    where: {
      Enrollment: {
        User: {
          id: userId,
        },
      },
    },
    include: {
      TicketType: true,
      Enrollment: {
        include: {
          User: true,
        },
      },
    },
  });
}

const ticketsRepository = { findTicketTypes, findTicketByUserId };

export default ticketsRepository;
