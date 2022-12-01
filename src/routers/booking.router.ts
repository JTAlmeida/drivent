import { Router } from "express";
import { authenticateToken } from "@/middlewares";
import { validateBody } from "@/middlewares";
import { upsertBookingSchema } from "@/schemas";
import { getBooking, createBooking, updateBooking } from "@/controllers/booking-controller";

const bookingRouter = Router();

bookingRouter
  .all("/*", authenticateToken)
  .get("/", getBooking)
  .post("/", validateBody(upsertBookingSchema), createBooking)
  .put("/:bookingId", validateBody(upsertBookingSchema), updateBooking);

export { bookingRouter };
