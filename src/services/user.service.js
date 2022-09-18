const Joi = require("joi");
const { User } = require("../models");

module.exports = {
    verifyBodyUpdateInfos: async (body) => {
        let user = Joi.object()
            .keys({
                firstname: Joi.string().required(),
                lastname: Joi.string().required(),
                phone: Joi.string()
                    .regex(/^(\+|00)[1-9][0-9 \-\(\)\.]{7,32}$/)
                    .required(),
            })
            .validate(body);
        if (user.error) {
            return {
                error: user.error.details[0].message
                    .replace(/\\/g, "")
                    .replace(/"/g, "")
                    .split(":")[0],
            };
        }
        return true;
    },
    verifyBodyCreateUser: async (body) => {
        let user = Joi.object()
            .keys({
                firstname: Joi.string().required(),
                lastname: Joi.string().required(),
                email: Joi.string()
                    .regex(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/)
                    .required(),
                phone: Joi.string()
                    .regex(/^(\+|00|0)[1-9][0-9 \-\(\)\.]{7,32}$/)
                    .required(),
                password: Joi.string().min(8).required(),
                birthdate: Joi.date().required(),
                country: Joi.string().required(),
                adress: Joi.string().optional(),
                gender: Joi.number().integer().optional(),
            })
            .validate(body);
        if (user.error) {
            return {
                error: user.error.details[0].message
                    .replace(/\\/g, "")
                    .replace(/"/g, "")
                    .split(":")[0],
            };
        }
        user = await User.findOne({ email: body.email });
        if (user) {
            return { error: "Email already exists" };
        }
        user = await User.findOne({ phone: body.phone });
        if (user) {
            return { error: "Phone already exists" };
        }
        return true;
    },
    verifyBodyUpdateUser: async (body, id) => {
        let user = Joi.object()
            .keys({
                firstname: Joi.string().required(),
                lastname: Joi.string().required(),
                email: Joi.string()
                    .regex(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/)
                    .required(),
                phone: Joi.string()
                    .regex(/^(\+|00|0)[1-9][0-9 \-\(\)\.]{7,32}$/)
                    .required(),
                password: Joi.string().min(8).optional(),
            })
            .validate(body);
        if (user.error) {
            return {
                error: user.error.details[0].message
                    .replace(/\\/g, "")
                    .replace(/"/g, "")
                    .split(":")[0],
            };
        }
        user = await User.findOne({ _id: { $ne: id }, email: body.email });
        if (user) {
            return { error: "Email already exists" };
        }
        user = await User.findOne({ _id: { $ne: id }, phone: body.phone });
        if (user) {
            return { error: "Phone already exists" };
        }
        return true;
    },
};
