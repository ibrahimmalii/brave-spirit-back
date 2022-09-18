const { Admin } = require("../models");
const Auth = require("../services/auth.service");
const { errorHandler } = require("../services/errorHandler");
const Joi = require("joi");
const { sendMail } = require("../services/mail.service");

module.exports = {
    login: async (req, res) => {
        try {
            //validate the body first
            const bodyVerification = Joi.object()
                .keys({
                    email: Joi.string()
                        .regex(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/)
                        .required(),
                    password: Joi.string().required(),
                })
                .validate(req.body);
            if (bodyVerification.error) {
                return res.status(400).json({
                    error: bodyVerification.error.details[0].message
                        .replace(/\\/g, "")
                        .replace(/"/g, "")
                        .split(":")[0],
                });
            }
            //verify if admin exists
            Admin.findOne(
                {
                    email: req.body.email,
                },
                { refreshtoken: 0 },
                async (error, admin) => {
                    if (error) {
                        await errorHandler(req, res, error);
                    }
                    if (!admin) {
                        return res.status(409).json({
                            error: "Admin doesn't exist",
                        });
                    }
                    //generate the token and the refresh token
                    let result = Auth.verifyAuthenticationInformation(
                        admin,
                        req.body.password
                    );
                    if (result && result === "password doesn't match") {
                        return res.status(409).json({
                            error: "password doesn't match",
                        });
                    } else if (result) {
                        //update the admin's refresh token
                        await Admin.updateOne(
                            { _id: admin.id },
                            {
                                refreshtoken: result.refreshtoken,
                            }
                        );
                        return res.status(200).json(result);
                    } else {
                        return res.status(409).json({
                            error: "Error on verifying the authentication informations",
                        });
                    }
                }
            );
        } catch (error) {
            return res.status(500).json({
                error: error,
            });
        }
    },
    refreshToken: async (req, res) => {
        try {
            if (!req.body.refreshtoken) {
                return res.status(400).json({ error: "Refresh token missing" });
            }
            //find admin by refresh token
            Admin.findOne(
                {
                    refreshtoken: req.body.refreshtoken,
                },
                { password: 0, refreshtoken: 0 },
                async (error, admin) => {
                    if (error) {
                        await errorHandler(req, res, error);
                    }
                    if (!admin) {
                        return res.status(404).json({
                            error: "Admin not found",
                        });
                    }
                    //create the access token
                    return res.status(200).json({
                        accessToken: await Auth.createToken(admin),
                    });
                }
            );
        } catch (error) {
            return res.status(500).json({ error: error });
        }
    },
    logout: async (req, res) => {
        try {
            //find admin by refresh token
            Admin.findOne({ _id: req.decode._id }, async (error, admin) => {
                if (error) {
                    await errorHandler(req, res, error);
                }
                if (!admin) {
                    return res.status(404).json({ error: "Admin not found" });
                }
                //make the refresh token null to delete it and logout
                await Admin.updateOne(
                    { _id: admin._id },
                    {
                        refreshtoken: null,
                    }
                );
                return res.status(200).send({ message: "you are logged out" });
            });
        } catch (error) {
            return res.status(500).json({ error: error });
        }
    },
    generateNewPassword: async (req, res) => {
        try {
            //find the admin
            let admin = await Admin.find({});
            if (!admin || (admin && admin.length > 1)) {
                return res.status(404).json({ error: "Admin not found" });
            }
            //generate a random password then hash it and update the admin password with the generated password
            const password = await Auth.randomPasswordAdmin();
            const hashedPass = await Auth.hashPassword(password);
            await Admin.updateOne(
                { _id: admin[0]._id },
                {
                    password: hashedPass,
                }
            );
            //send the password by email
            let msg = `<span>${password} : تجد مرفق كلمة المرور الخاصة بك </span> `;
            await sendMail(req.body.email, msg, "Generated Password Email");
            return res.status(200).json({ message: msg });
        } catch (error) {
            return res.status(500).json({ error: error });
        }
    },
    getAdmin: (req, res) => {
        try {
            Admin.findOne(
                {
                    _id: req.decode._id,
                },
                { password: 0, refreshtoken: 0 },
                async (error, admin) => {
                    if (error) {
                        await errorHandler(req, res, error);
                    }
                    return res.status(200).json(admin);
                }
            );
        } catch (error) {
            return res.status(500).json({ error: error });
        }
    },
};
