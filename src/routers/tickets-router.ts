import { Router } from "express";
import { authenticateToken, validateBody } from "@/middlewares";
import { getTicketTypes, getTicket, createTicket } from "@/controllers/tickets-controller";
import { createTicketSchema } from "@/schemas";

const ticketsRouter = Router();

ticketsRouter
  .all("/*", authenticateToken)
  .get("/", getTicket)
  .get("/types", getTicketTypes)
  .post("/", validateBody(createTicketSchema), createTicket);

export { ticketsRouter };
