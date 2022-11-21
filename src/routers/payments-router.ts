import { Router } from "express";
import { authenticateToken, validateBody } from "@/middlewares";
import { getPayment, processPayment } from "@/controllers/payments-controller";
import { createPaymentSchema } from "@/schemas/payments-schemas";

const paymentsRouter = Router();

paymentsRouter
  .all("/*", authenticateToken)
  .get("/", getPayment)
  .post("/process", validateBody(createPaymentSchema), processPayment);

export { paymentsRouter };
