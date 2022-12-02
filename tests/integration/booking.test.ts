import app, { init } from "@/app";
import httpStatus from "http-status";
import supertest from "supertest";
import faker from "@faker-js/faker";
import * as jwt from "jsonwebtoken";
import { cleanDb, generateValidToken } from "../helpers";
import { TicketStatus } from "@prisma/client";
import { prisma } from "@/config";
import {
  createUser,
  createEnrollmentWithAddress,
  createTicketType,
  createTicket,
  createHotel,
  createRoom,
  createBooking,
} from "../factories";

beforeAll(async () => {
  await init();
});

beforeEach(async () => {
  await cleanDb();
});

const server = supertest(app);

describe("GET /booking", () => {
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

  describe("when token is valid", () => {
    it("should respond with status 404 if user doesn't have a bookng.", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketType({ isRemote: false, includesHotel: true });
      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);

      const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(httpStatus.NOT_FOUND);
    });

    it("should respond with status 200 and booking data if user does have a booking.", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketType({ isRemote: false, includesHotel: true });
      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const hotel = await createHotel();
      const room = await createRoom({ hotelId: hotel.id, capacity: 2 });
      const booking = await createBooking({ userId: user.id, roomId: room.id });

      const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(httpStatus.OK);
      expect(response.body).toEqual({
        id: booking.id,
        Room: {
          id: room.id,
          name: room.name,
          capacity: room.capacity,
          hotelId: room.hotelId,
        },
      });
    });
  });
});

describe("POST /booking", () => {
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

  describe("when token is valid", () => {
    it("should respond with status 400 if roomId isn't a number.", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketType({ isRemote: false, includesHotel: true });
      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const hotel = await createHotel();
      await createRoom({ hotelId: hotel.id, capacity: 2 });
      const roomId = faker.lorem.word();

      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ roomId });

      expect(response.status).toBe(httpStatus.BAD_REQUEST);
    });

    it("should respond with status 403 if user doesn't have a paid ticket that isn't remote and includes hotel.", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketType({ isRemote: false, includesHotel: true });
      await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);
      const hotel = await createHotel();
      const room = await createRoom({ hotelId: hotel.id, capacity: 2 });

      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ roomId: room.id });

      expect(response.status).toBe(httpStatus.FORBIDDEN);
    });

    it("should respond with status 404 if there's no room for given roomId.", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketType({ isRemote: false, includesHotel: true });
      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      await createHotel();
      const roomId = faker.datatype.number();

      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ roomId });

      expect(response.status).toBe(httpStatus.NOT_FOUND);
    });

    it("should respond with status 403 if user tries to make a second booking.", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketType({ isRemote: false, includesHotel: true });
      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const hotel = await createHotel();
      const room = await createRoom({ hotelId: hotel.id, capacity: 2 });
      const secondRoom = await createRoom({ hotelId: hotel.id, capacity: 2 });
      await createBooking({ userId: user.id, roomId: secondRoom.id });

      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ roomId: room.id });

      expect(response.status).toBe(httpStatus.FORBIDDEN);
    });

    it("should respond with status 403 if room capacity reached the limit.", async () => {
      const user = await createUser();
      const secondUser = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketType({ isRemote: false, includesHotel: true });
      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const hotel = await createHotel();
      const room = await createRoom({ hotelId: hotel.id, capacity: 1 });
      await createBooking({ userId: secondUser.id, roomId: room.id });

      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ roomId: room.id });

      expect(response.status).toBe(httpStatus.FORBIDDEN);
    });

    it("should respond with status 200 and bookingId if everything's ok and also insert into database.", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketType({ isRemote: false, includesHotel: true });
      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const hotel = await createHotel();
      const room = await createRoom({ hotelId: hotel.id, capacity: 2 });

      const dbBookingCountBefore = await prisma.booking.count();
      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ roomId: room.id });
      const dbBookingCountAfter = await prisma.booking.count();

      expect(response.status).toBe(httpStatus.OK);
      expect(response.body).toEqual({
        bookingId: expect.any(Number),
      });
      expect(dbBookingCountBefore).toEqual(0);
      expect(dbBookingCountAfter).toEqual(1);
    });
  });
});

describe("PUT /booking/:bookingId", () => {
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

  describe("when token is valid", () => {
    it("should respond with status 400 if roomId isn't a number.", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketType({ isRemote: false, includesHotel: true });
      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const hotel = await createHotel();
      const room = await createRoom({ hotelId: hotel.id, capacity: 2 });
      const booking = await createBooking({ userId: user.id, roomId: room.id });
      const roomId = faker.lorem.word();

      const response = await server
        .put(`/booking/${booking.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ roomId });

      expect(response.status).toBe(httpStatus.BAD_REQUEST);
    });

    it("should respond with status 400 if roomId isn't a number.", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketType({ isRemote: false, includesHotel: true });
      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const hotel = await createHotel();
      const room = await createRoom({ hotelId: hotel.id, capacity: 2 });
      const booking = await createBooking({ userId: user.id, roomId: room.id });
      const roomId = faker.lorem.word();

      const response = await server
        .put(`/booking/${booking.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ roomId });

      expect(response.status).toBe(httpStatus.BAD_REQUEST);
    });

    it("should respond with status 400 if bookingId isn't a number.", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketType({ isRemote: false, includesHotel: true });
      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const hotel = await createHotel();
      const room = await createRoom({ hotelId: hotel.id, capacity: 2 });
      await createBooking({ userId: user.id, roomId: room.id });
      const bookingId = faker.lorem.word();

      const response = await server
        .put(`/booking/${bookingId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ roomId: room.id });

      expect(response.status).toBe(httpStatus.BAD_REQUEST);
    });

    it("should respond with status 403 if user doesn't have a paid ticket that isn't remote and includes hotel.", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketType({ isRemote: false, includesHotel: true });
      await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);
      const hotel = await createHotel();
      const room = await createRoom({ hotelId: hotel.id, capacity: 2 });
      const booking = await createBooking({ userId: user.id, roomId: room.id });

      const response = await server
        .put(`/booking/${booking.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ roomId: room.id });

      expect(response.status).toBe(httpStatus.FORBIDDEN);
    });

    it("should respond with status 404 if there's no room for given roomId.", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketType({ isRemote: false, includesHotel: true });
      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const hotel = await createHotel();
      const room = await createRoom({ hotelId: hotel.id, capacity: 2 });
      const booking = await createBooking({ userId: user.id, roomId: room.id });

      const response = await server
        .put(`/booking/${booking.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ roomId: room.id + 1 });

      expect(response.status).toBe(httpStatus.NOT_FOUND);
    });

    it("should respond with status 403 if user doesn't have a booking to update.", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketType({ isRemote: false, includesHotel: true });
      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const hotel = await createHotel();
      const room = await createRoom({ hotelId: hotel.id, capacity: 2 });
      const bookingId = faker.datatype.number();

      const response = await server
        .put(`/booking/${bookingId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ roomId: room.id });

      expect(response.status).toBe(httpStatus.FORBIDDEN);
    });

    it("should respond with status 403 if user tries to update a booking that isn't his.", async () => {
      const user = await createUser();
      const secondUser = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketType({ isRemote: false, includesHotel: true });
      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const hotel = await createHotel();
      const room = await createRoom({ hotelId: hotel.id, capacity: 2 });
      const booking = await createBooking({ userId: secondUser.id, roomId: room.id });

      const response = await server
        .put(`/booking/${booking.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ roomId: room.id });

      expect(response.status).toBe(httpStatus.FORBIDDEN);
    });

    it("should respond with status 403 if room capacity reached the limit.", async () => {
      const user = await createUser();
      const secondUser = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketType({ isRemote: false, includesHotel: true });
      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const hotel = await createHotel();
      const room = await createRoom({ hotelId: hotel.id, capacity: 1 });
      const secondRoom = await createRoom({ hotelId: hotel.id, capacity: 1 });
      const booking = await createBooking({ userId: user.id, roomId: secondRoom.id });
      await createBooking({ userId: secondUser.id, roomId: room.id });

      const response = await server
        .put(`/booking/${booking.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ roomId: room.id });

      expect(response.status).toBe(httpStatus.FORBIDDEN);
    });

    it("should respond with status 200 and bookingId if everything's ok and also update database.", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketType({ isRemote: false, includesHotel: true });
      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const hotel = await createHotel();
      const room = await createRoom({ hotelId: hotel.id, capacity: 2 });
      const secondRoom = await createRoom({ hotelId: hotel.id, capacity: 2 });
      const booking = await createBooking({ userId: user.id, roomId: secondRoom.id });

      const response = await server
        .put(`/booking/${booking.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ roomId: room.id });

      const updatedBooking = await prisma.booking.findUnique({ where: { id: booking.id } });

      expect(response.status).toBe(httpStatus.OK);
      expect(response.body).toEqual({
        bookingId: expect.any(Number),
      });
      expect(updatedBooking.roomId).toBe(room.id);
    });
  });
});
