import Joi from "joi";

export const upsertBookingSchema = Joi.object({
  roomId: Joi.number().required(),
});
