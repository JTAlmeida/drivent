import { AuthenticatedRequest } from "@/middlewares";
import hotelsService from "@/services/hotels-service";
import { Response } from "express";
import httpStatus from "http-status";

export async function getHotels(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;

  try {
    const hotels = await hotelsService.getHotels(userId);

    res.status(httpStatus.OK).send(hotels);
    return;
  } catch (error) {
    if (error.name === "ForbiddenError") {
      return res.sendStatus(httpStatus.FORBIDDEN);
    }
    if (error.name === "PaymentError") {
      return res.sendStatus(httpStatus.PAYMENT_REQUIRED);
    }
    return res.sendStatus(httpStatus.INTERNAL_SERVER_ERROR);
  }
}

export async function getHotelRooms(req: AuthenticatedRequest, res: Response) {
  try {
    res.status(httpStatus.OK).send("ToDo");
  } catch (error) {
    return res.sendStatus(httpStatus.INTERNAL_SERVER_ERROR);
  }
}
