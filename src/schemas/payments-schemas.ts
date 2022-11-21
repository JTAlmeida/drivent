import Joi from "joi";

export const createPaymentSchema = Joi.object({
  ticketId: Joi.number().required(),
  cardData: Joi.object({
    issuer: Joi.string(),
    number: Joi.number(),
    name: Joi.string(),
    expirationDate: Joi.string(),
    cvv: Joi.number(),
  }).required(),
});
