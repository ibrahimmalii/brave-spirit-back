const { Book } = require("../models");
const { errorHandler } = require("../services/errorHandler");
const Joi = require("joi");
const path = require("path");

module.exports = {
    getBookDownloads: async (req, res) => {
        try {
            return res.status(200).json(await Book.count({}));
        } catch (error) {
            return res.status(500).json({ error: error });
        }
    },
    sendBook: async (req, res) => {
        try {
            let book = Joi.object()
                .keys({
                    firstname: Joi.string().required(),
                    lastname: Joi.string().required(),
                    email: Joi.string()
                        .regex(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/)
                        .required(),
                })
                .validate(req.body);
            if (book.error) {
                return res.status(400).json({
                    error: book.error.details[0].message
                        .replace(/\\/g, "")
                        .replace(/"/g, "")
                        .split(":")[0],
                });
            }
            await Book.create(req.body, async (error, book) => {
                if (error) {
                    await errorHandler(req, res, error);
                }
                return res.download(
                    path.join(__dirname, "../../public/home/book/book.pdf"),
                    (error) => {
                        if (error) {
                            return res.status(500).json({ error: error });
                        }
                    }
                );
            });
        } catch (error) {
            return res.status(500).json({ error: error });
        }
    },
};
