const { Contact } = require("../models");
const contactService = require("../services/contact.service");
const { errorHandler } = require("../services/errorHandler");
const { sendMail } = require("../services/mail.service");

module.exports = {
    getContacts: async (req, res) => {
        try {
            Contact.find({}, async (error, contacts) => {
                if (error) {
                    await errorHandler(req, res, error);
                }
                if (!contacts) {
                    return res.status(404).json({ error: "No contact found" });
                }
                return res.status(200).json(contacts);
            });
        } catch (error) {
            return res.status(500).json({ error: error });
        }
    },
    getContact: async (req, res) => {
        try {
            Contact.findOne({ _id: req.params.id }, async (error, contact) => {
                if (error) {
                    await errorHandler(req, res, error);
                }
                if (!contact) {
                    return res.status(404).json({ error: "Contact not found" });
                }
                return res.status(200).json(contact);
            });
        } catch (error) {
            return res.status(500).json({ error: error });
        }
    },
    createContact: async (req, res) => {
        try {
            let body = JSON.parse(JSON.stringify(req.body));
            //verify body of the creation
            const bodyVerification = await contactService.verifyBody(body);
            if (bodyVerification.error) {
                return res.status(400).json({
                    error: bodyVerification.error,
                });
            }
            await Contact.create(body, async (error, contact) => {
                if (error) {
                    await errorHandler(req, res, error);
                }
                return res
                    .status(200)
                    .json({ message: "Contact sent successfully" });
            });
        } catch (error) {
            return res.status(500).json({ error: error });
        }
    },
    archiveContact: async (req, res) => {
        try {
            Contact.findOne({ _id: req.params.id }, async (error, contact) => {
                if (error) {
                    await errorHandler(req, res, error);
                }
                if (!contact) {
                    return res.status(404).json({ error: "Contact not found" });
                }
                await Contact.updateOne(
                    {
                        _id: req.params.id,
                    },
                    {
                        archived: !contact.archived,
                    }
                );
                if (contact.archived) {
                    return res
                        .status(200)
                        .json({ message: "Contact unarchived successfully" });
                }
                return res
                    .status(200)
                    .json({ message: "Contact archived successfully" });
            });
        } catch (error) {
            return res.status(500).json({ error: error });
        }
    },
    answerContact: async (req, res) => {
        try {
            if (!req.body.answer) {
                return res
                    .status(400)
                    .json({ error: "The answer in the body is missing" });
            }
            Contact.findOne({ _id: req.params.id }, async (error, contact) => {
                if (error) {
                    await errorHandler(req, res, error);
                }
                if (!contact) {
                    return res.status(404).json({ error: "Contact not found" });
                }
                //send confimation email
                let msg = `<span>${req.body.answer}</span>`;
                sendMail(contact.email, msg, "Answer To Contact");
                await Contact.updateOne(
                    {
                        _id: req.params.id,
                    },
                    {
                        answer: req.body.answer,
                    }
                );
                return res
                    .status(200)
                    .json({ message: "Answer to contact done successfully" });
            });
        } catch (error) {
            return res.status(500).json({ error: error });
        }
    },
};
