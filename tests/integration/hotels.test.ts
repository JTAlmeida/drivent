import app, { init } from "@/app";
import httpStatus from "http-status";
import supertest from "supertest";
import { cleanDb, generateValidToken } from "../helpers";
import faker from "@faker-js/faker";
import * as jwt from "jsonwebtoken";
import {
  createUser,
  createEnrollmentWithAddress,
  createTicketType,
  createTicket,
  createPayment,
  createHotel,
} from "../factories";
import { TicketStatus } from "@prisma/client";

beforeAll(async () => {
  await init();
});

beforeEach(async () => {
  await cleanDb();
});

const server = supertest(app);

describe("GET /hotels", () => {
  it("should respond with status 401 if no token is given", async () => {
    const response = await server.get("/hotels");

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if given token is not valid", async () => {
    const token = faker.lorem.word();

    const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if there is no session for given token", async () => {
    const userWithoutSession = await createUser();

    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

    const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe("when token is valid:", () => {
    it("should respond with status 403 if user doesn't have a ticket that includes hotel.", async () => {
      const user = await createUser();

      const token = await generateValidToken(user);

      const enrollment = await createEnrollmentWithAddress(user);

      const ticketType = await createTicketType({ isRemote: false, includesHotel: false });

      await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);
      const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(httpStatus.FORBIDDEN);
    });

    it("should respond with status 402 if user haven't paid the ticket that includes hotel.", async () => {
      const user = await createUser();

      const token = await generateValidToken(user);

      const enrollment = await createEnrollmentWithAddress(user);

      const ticketType = await createTicketType({ isRemote: false, includesHotel: true });

      await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);
      const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(httpStatus.PAYMENT_REQUIRED);
    });

    it("should respond with an empty array when user paid the ticket but there are no hotels.", async () => {
      const user = await createUser();

      const token = await generateValidToken(user);

      const enrollment = await createEnrollmentWithAddress(user);

      const ticketType = await createTicketType({ isRemote: false, includesHotel: true });

      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);

      await createPayment(ticket.id, ticketType.price);
      const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);

      expect(response.body).toEqual([]);
    });

    it("should respond with status 200 and hotels data.", async () => {
      const user = await createUser();

      const token = await generateValidToken(user);

      const enrollment = await createEnrollmentWithAddress(user);

      const ticketType = await createTicketType({ isRemote: false, includesHotel: true });

      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);

      await createPayment(ticket.id, ticketType.price);

      const hotel = await createHotel();

      const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(httpStatus.OK);
      expect(response.body).toEqual([
        {
          id: hotel.id,
          name: hotel.name,
          image: hotel.image,
          createdAt: hotel.createdAt.toISOString(),
          updatedAt: hotel.updatedAt.toISOString(),
        },
      ]);
    });
  });
});

