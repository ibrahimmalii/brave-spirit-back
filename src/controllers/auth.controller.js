const { User } = require("../models");
const authService = require("../services/auth.service");
const { errorHandler } = require("../services/errorHandler");
const Joi = require("joi");
const { sendMail } = require("../services/mail.service");
const { sign } = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

module.exports = {
    login: async (req, res) => {
        try {
            let body = JSON.parse(JSON.stringify(req.body));
            //validate the body first
            const bodyVerification = Joi.object()
                .keys({
                    email: Joi.string()
                        .regex(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/)
                        .required(),
                    password: Joi.string().required(),
                })
                .validate(body);
            if (bodyVerification.error) {
                return res.status(400).json({
                    error: bodyVerification.error.details[0].message
                        .replace(/\\/g, "")
                        .replace(/"/g, "")
                        .split(":")[0],
                });
            }
            //verify if user exists
            User.findOne(
                {
                    email: body.email,
                },
                { refreshtoken: 0, google_id: 0 },
                async (error, user) => {
                    if (error) {
                        await errorHandler(req, res, error);
                    }
                    if (!user) {
                        return res.status(409).json({
                            error: "User doesn't exist",
                        });
                    }
                    if (!user.confirmed) {
                        return res.status(409).json({
                            error: "User account not verified yet",
                        });
                    }
                    if (!user.active) {
                        return res.status(409).json({
                            error: "User account disabled",
                        });
                    }
                    //generate the token and the refresh token
                    let result = authService.verifyAuthenticationInformation(
                        user,
                        body.password
                    );
                    if (result && result === "password doesn't match") {
                        return res.status(409).json({
                            error: "password doesn't match",
                        });
                    } else if (result) {
                        //update the user's refresh token
                        await User.updateOne(
                            { _id: user.id },
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
    loginGoogle: async (req, res) => {
        try {
            const body = JSON.parse(JSON.stringify(req.body));
            //validate the body first
            const bodyVerification = Joi.object()
                .keys({
                    email: Joi.string()
                        .regex(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/)
                        .required(),
                    google_id: Joi.string().required(),
                })
                .validate(body);
            if (bodyVerification.error) {
                return res.status(400).json({
                    error: bodyVerification.error.details[0].message
                        .replace(/\\/g, "")
                        .replace(/"/g, "")
                        .split(":")[0],
                });
            }
            //verify if user exists and match the email google_id combination
            User.findOne(
                {
                    email: body.email,
                    google_id: body.google_id,
                },
                { password: 0, refreshtoken: 0, google_id: 0 },
                async (error, user) => {
                    if (error) {
                        await errorHandler(req, res, error);
                    }
                    if (!user) {
                        return res.status(404).json({
                            error: "User not found",
                        });
                    }
                    if (!user.confirmed) {
                        return res.status(409).json({
                            error: "User account not verified yet",
                        });
                    }
                    if (!user.active) {
                        return res.status(409).json({
                            error: "User account disabled",
                        });
                    }
                    //update user's refresh token
                    const refreshtoken = await authService.createRefreshToken(
                        user
                    );
                    await User.updateOne(
                        { _id: user.id },
                        {
                            refreshtoken: refreshtoken,
                        }
                    );
                    return res.status(200).json({
                        jsontoken: await authService.createToken(user),
                        refreshtoken: refreshtoken,
                        user,
                    });
                }
            );
        } catch (error) {
            return res.status(500).json({
                error: error,
            });
        }
    },
    register: async (req, res) => {
        try {
            let body = JSON.parse(JSON.stringify(req.body));
            //verify body of registration
            const bodyVerification = await authService.verifyBodyRegister(body);
            if (bodyVerification.error) {
                return res.status(400).json({
                    error: bodyVerification.error,
                });
            }
            //hash the password
            body.password = authService.hashPassword(body.password);
            //create the user
            await User.create(body, async (error, user) => {
                if (error) {
                    await errorHandler(req, res, error);
                }
                user = JSON.parse(JSON.stringify(user));
                //create the refresh token for the user
                refreshtoken = await authService.createRefreshToken(user);
                await User.updateOne(
                    { _id: user.id },
                    {
                        refreshtoken: refreshtoken,
                    }
                );
                delete user.password;
                const jsontoken = sign({ user }, process.env.JWT_ACC_ACTIVATE, {
                    expiresIn: "1h",
                });
                //send confimation email
                let msg = `<span>لتأكيد بريدكم الإلكتروني يرجي زيارة </span> <a href='https://client.thebravespirit.org/confirm-email/${jsontoken}'>تأكيد</a>`;
                sendMail(user.email, msg, "Confirm Email");
                return res.status(200).json({
                    user: user,
                    accessToken: await authService.createToken(user),
                    refreshToken: refreshtoken,
                });
            });
        } catch (error) {
            return res.status(500).json({ error: error });
        }
    },
    registerGoogle: async (req, res) => {
        try {
            if (!req.body.token) {
                return res.status(400).json({ error: "Token is missing" });
            }
            // let payload = await axios.get(
            //     `https://oauth2.googleapis.com/tokeninfo?id_token=${req.body.token}`
            // );
            // if (payload.error) {
            //     return res.status(400).json({ error: payload.error.message });
            // }
            // return res.json(payload.data);

            try {
                const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
                const ticket = await client.verifyIdToken({
                    idToken: req.body.token,
                    Audience: process.env.GOOGLE_CLIENT_ID,
                });
                payload = ticket.getPayload();
            } catch (error) {
                return res.status(500).json({
                    error: "error on getting the ticket and the payload.",
                });
            }
            let user = await User.findOne({ email: payload.email });
            if (user) {
                return res.status(403).json({ error: "Email already exists" });
            }
            user = await User.findOne({ google_id: payload.sub });
            if (user) {
                return res
                    .status(403)
                    .json({ error: "Google ID already exists" });
            }
            User.create(
                {
                    google_id: payload.sub,
                    email: payload.email,
                    firstname: payload.given_name ? payload.given_name : "",
                    lastname: payload.family_name
                        ? payload.family_name
                        : payload.given_name,
                    image: payload.picture ? payload.picture : "default.png",
                    gender: payload.gender ? payload.gender : 0,
                    phone: payload.phone ? payload.phone : undefined,
                    confirmed: true,
                },
                async (error, user) => {
                    if (error) {
                        await errorHandler(req, res, error);
                    }
                    if (!user) {
                        return res.status(500).json({
                            error: "Error on creating the user account",
                        });
                    }
                    //get the image from google and copy it locally
                    if (user.image !== "default.png") {
                        const url = user.image;
                        const writer = fs.createWriteStream(
                            path.join(
                                __dirname,
                                `../../public/users/${user._id}.jpg`
                            )
                        );
                        const response = await axios({
                            url,
                            method: "GET",
                            responseType: "stream",
                        });
                        await response.data.pipe(writer);
                    }
                    //create the refresh token for the user
                    refreshtoken = await authService.createRefreshToken(user);
                    await User.updateOne(
                        { _id: user._id },
                        {
                            refreshtoken: refreshtoken,
                            image:
                                user.image !== "default.png"
                                    ? `${user._id}.jpg`
                                    : user.image,
                        }
                    );
                    delete user.google_id;
                    user.image =
                        user.image !== "default.png"
                            ? `${user._id}.jpg`
                            : user.image;
                    return res.status(200).json({
                        user: user,
                        accessToken: await authService.createToken(user),
                        refreshToken: refreshtoken,
                    });
                }
            );
        } catch (error) {
            return res.status(500).json({ error: error });
        }
    },
    refreshToken: async (req, res) => {
        try {
            //verify if refresh token exists in the body
            if (!req.body.refreshtoken) {
                return res.status(400).json({ error: "Refreshtoken missing" });
            }
            //find user by refresh token
            User.findOne(
                {
                    refreshtoken: req.body.refreshtoken,
                },
                { password: 0, refreshtoken: 0, google_id: 0, __v: 0 },
                async (error, user) => {
                    if (error) {
                        await errorHandler(req, res, error);
                    }
                    if (!user) {
                        return res.status(404).json({
                            error: "User not found",
                        });
                    }
                    //create the access token
                    return res.status(200).json({
                        accessToken: await authService.createToken(user),
                    });
                }
            );
        } catch (error) {
            return res.status(500).json({ error: error });
        }
    },
    forgetPassword: async (req, res) => {
        try {
            //verify if mail exists in the body
            if (!req.body.email) {
                return res.status(400).json({ error: "Email missing" });
            }
            //find the user
            let user = await User.findOne({ email: req.body.email });
            if (!user) {
                return res.status(404).json({ error: "user not found" });
            }
            //generate a random password then hash it and update the user password with the generated password
            const password = await authService.randomPassword();
            const hashedPass = await authService.hashPassword(password);
            await User.updateOne(
                { _id: user.id },
                {
                    password: hashedPass,
                }
            );
            //send the password by email
            let msg = `<span>${password} : تجد مرفق كلمة المرور الخاصة بك </span> `;
            sendMail(req.body.email, msg, "Forget Password");
            return res.status(200).json({ message: "Email sent successfully" });
        } catch (error) {
            return res.status(500).json({ error: error });
        }
    },
    verifyUserEmail: async (req, res) => {
        try {
            if (!req.headers["authorization"]) {
                return res.status(403).json({
                    error: "Token is missing, cannot access activate the user without the token.",
                });
            }

            let token = req.get("authorization").slice(7);
            await authService
                .decodeToken(token, process.env.JWT_ACC_ACTIVATE)
                .then(async (decode) => {
                    if (!decode) {
                        return res.status(403).json({
                            error: "The token is not valid",
                        });
                    }
                    //find the user
                    let user = await User.findOne({
                        _id: decode.user._id,
                        confirmed: false,
                        active: true,
                    });
                    if (!user) {
                        return res
                            .status(404)
                            .json({ error: "user not found" });
                    }
                    await User.updateOne(
                        { _id: user._id },
                        {
                            email: user.email,
                            confirmed: true,
                        }
                    );
                    return res.status(200).json({ message: "Email confirmed" });
                });
        } catch (error) {
            return res.status(500).json({ error: error });
        }
    },
    logout: async (req, res) => {
        try {
            //find user by refresh token
            User.findOne({ _id: req.decode._id }, async (error, user) => {
                if (error) {
                    await errorHandler(req, res, error);
                }
                if (!user) {
                    return res.status(404).json({ error: "User not found" });
                }
                //make the refresh token null to delete it and logout
                await User.updateOne(
                    { _id: user._id },
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
};
