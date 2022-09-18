const Joi = require("joi");
const { Subscription } = require("../models");

module.exports = {
    verifyBodyCreation: async (body) => {
        let subscription = Joi.object()
            .keys({
                user: Joi.string().required(),
                course: Joi.string().required(),
                price: Joi.object({
                    euro: Joi.number().required(),
                    dzd: Joi.number().required(),
                }).required(),
                order_id: Joi.string().optional(),
                seller_transaction_id: Joi.string().optional(),
                method: Joi.string()
                    .valid("visa", "paypal", "ccp", "free")
                    .required(),
                state: Joi.string()
                    .valid("received", "completed", "declined", "error")
                    .required(),
            })
            .validate(body);
        if (subscription.error) {
            return {
                error: subscription.error.details[0].message
                    .replace(/\\/g, "")
                    .replace(/"/g, "")
                    .split(":")[0],
            };
        }
        //check if the  course is not already subscribed by the user
        subscription = await Subscription.findOne({
            user: body.user,
            course: body.course,
        });
        if (subscription) {
            if (subscription.state === "completed") {
                return {
                    error: "You are already subscribed to this course",
                };
            }
            return {
                error: "You already sent a subscribe request to this course",
            };
        }
        return true;
    },
    verifyBodyRequest: async (body) => {
        let subscription = Joi.object()
            .keys({
                user: Joi.string().required(),
                course: Joi.string().required(),
                price: Joi.object({
                    euro: Joi.number().required(),
                    dzd: Joi.number().required(),
                }).required(),
                state: Joi.string().valid("received").required(),
                request: Joi.object({
                    type: Joi.string().valid("cib", "help").required(),
                    file: Joi.string().optional(),
                    reason: Joi.string().optional(),
                }).required(),
            })
            .validate(body);
        if (subscription.error) {
            return {
                error: subscription.error.details[0].message
                    .replace(/\\/g, "")
                    .replace(/"/g, "")
                    .split(":")[0],
            };
        }
        subscription = await Subscription.findOne({
            user: body.user,
            course: body.course,
        });
        if (subscription) {
            if (subscription.state === "completed") {
                return {
                    error: "You are already subscribed to this course",
                };
            }
            return {
                error: "You already sent a subscribe request to this course",
            };
        }
        return true;
    },
};
