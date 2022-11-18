import { Router } from "express";
import { authenticateToken, validateBody } from "@/middlewares";
import { getPayment, processPayment } from "@/controllers/payments-controller";

const paymentsRouter = Router();

paymentsRouter
  .all("/*", authenticateToken)
  .get("/", getPayment)
  .post("/process", processPayment);

export { paymentsRouter };
