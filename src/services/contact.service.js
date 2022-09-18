const Joi = require("joi");

module.exports = {
    verifyBody: async (body) => {
        let contact = Joi.object()
            .keys({
                name: Joi.string().required(),
                subject: Joi.string().required(),
                email: Joi.string()
                    .regex(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/)
                    .required(),
                courseName: Joi.string().optional(),
                message: Joi.string().required(),
            })
            .validate(body);
        if (contact.error) {
            return {
                error: contact.error.details[0].message
                    .replace(/\\/g, "")
                    .replace(/"/g, "")
                    .split(":")[0],
            };
        }
        return true;
    },
};
