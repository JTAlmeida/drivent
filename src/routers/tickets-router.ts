import { Router } from "express";
import { authenticateToken, validateBody } from "@/middlewares";
import { getTicketTypes, getTickets, createTicket } from "@/controllers/tickets-controller";

const ticketsRouter = Router();

ticketsRouter
  .all("/*", authenticateToken)
  .get("/", getTickets)
  .get("/types", getTicketTypes)
  .post("/", createTicket);

export { ticketsRouter };
