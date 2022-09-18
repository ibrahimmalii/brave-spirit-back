const { User, Subscription } = require("../models");
const userService = require("../services/user.service");
const authService = require("../services/auth.service");
const { errorHandler } = require("../services/errorHandler");
const Joi = require("joi");
const { sendMail } = require("../services/mail.service");
const { sign } = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

module.exports = {
    getUsers: async (req, res) => {
        try {
            let { size, page } = req.query;
            size = size != null ? +req.query.size : 1;
            User.find(
                // { active: true },
                {},
                { password: 0, refreshtoken: 0 },
                {
                    skip: (page != null ? page - 1 : 0) * size,
                    limit: size,
                    sort: {
                        createdAt: 1,
                    },
                },
                async (error, users) => {
                    if (error) {
                        await errorHandler(req, res, error);
                    }
                    if (!users) {
                        return res.status(404).json({ error: "No user found" });
                    }
                    return res.status(200).json(users);
                }
            );
        } catch (error) {
            return res.status(500).json({ error: error });
        }
    },
    getDeletedUsers: async (req, res) => {
        try {
            let { size, page } = req.query;
            size = size != null ? +req.query.size : 1;
            User.find(
                { active: false },
                { password: 0, refreshtoken: 0 },
                {
                    skip: (page != null ? page - 1 : 0) * size,
                    limit: size,
                    sort: {
                        createdAt: 1,
                    },
                },
                async (error, users) => {
                    if (error) {
                        await errorHandler(req, res, error);
                    }
                    if (!users) {
                        return res.status(404).json({ error: "No user found" });
                    }
                    return res.status(200).json(users);
                }
            );
        } catch (error) {
            return res.status(500).json({ error: error });
        }
    },
    getUser: async (req, res) => {
        try {
            User.findOne(
                { _id: req.params.id },
                { password: 0, refreshtoken: 0 },
                async (error, user) => {
                    if (error) {
                        await errorHandler(req, res, error);
                    }
                    if (!user) {
                        return res.status(404).json({ error: "No user found" });
                    }
                    let subscriptions = await Subscription.find(
                        {
                            user: user._id,
                            state: { $ne: "received" },
                        },
                        { user: 0 }
                    );
                    subscriptions = JSON.parse(JSON.stringify(subscriptions));
                    let courses = subscriptions.map((subscription, index) => {
                        let course = subscription.course;
                        delete course.chapters;
                        delete subscriptions[index].course;
                        return course;
                    });
                    return res.status(200).json({
                        user: user,
                        courses: courses,
                        subscriptions: subscriptions,
                    });
                }
            );
        } catch (error) {
            return res.status(500).json({ error: error });
        }
    },
    createUser: async (req, res) => {
        try {
            let body = JSON.parse(JSON.stringify(req.body));
            //verify body of the creation
            const bodyVerification = await userService.verifyBodyCreateUser(
                body
            );
            if (bodyVerification.error) {
                return res.status(400).json({
                    error: bodyVerification.error,
                });
            }
            //hash the password
            body.password = authService.hashPassword(body.password);
            body.confirmed = true;
            //create the user
            await User.create(body, async (error, user) => {
                if (error) {
                    await errorHandler(req, res, error);
                }
                return res
                    .status(200)
                    .json({ message: "User created successfully" });
            });
        } catch (error) {
            return res.status(500).json({ error: error });
        }
    },
    updateUser: async (req, res) => {
        try {
            let body = JSON.parse(JSON.stringify(req.body));
            //verify body of update
            const bodyVerification = await userService.verifyBodyUpdateUser(
                body,
                req.params.id
            );
            if (bodyVerification.error) {
                return res.status(400).json({
                    error: bodyVerification.error,
                });
            }
            //hash the password if exists on the body
            if (body.password) {
                body.password = authService.hashPassword(body.password);
            }
            //update the user
            await User.updateOne(
                { _id: req.params.id },
                {
                    firstname: body.firstname,
                    lastname: body.lastname,
                    phone: body.phone,
                    email: body.email,
                    password: body.password,
                }
            );
            return res
                .status(200)
                .json({ message: "User updated successfully" });
        } catch (error) {
            return res.status(500).json({ error: error });
        }
    },
    changeStateUser: async (req, res) => {
        try {
            User.findOne(
                {
                    _id: req.params.id,
                },
                { password: 0, refreshtoken: 0, google_id: 0 },
                async (error, user) => {
                    if (error) {
                        await errorHandler(req, res, error);
                    }
                    if (!user) {
                        return res
                            .status(404)
                            .json({ error: "User not found" });
                    }
                    await User.updateOne(
                        {
                            _id: user._id,
                        },
                        {
                            active: !user.active,
                        }
                    );
                    if (user.active) {
                        return res.status(200).json({
                            message: "The account has beed disabled.",
                        });
                    }
                    return res
                        .status(200)
                        .json({ message: "The account has beed activated." });
                }
            );
        } catch (error) {
            return res.status(500).json({ error: error });
        }
    },
    getUserByToken: async (req, res) => {
        try {
            User.findOne(
                {
                    _id: req.decode._id,
                    active: true,
                    confirmed: true,
                },
                { password: 0, refreshtoken: 0, google_id: 0 },
                async (error, user) => {
                    if (error) {
                        await errorHandler(req, res, error);
                    }
                    if (!user) {
                        return res
                            .status(404)
                            .json({ error: "User not found" });
                    }
                    let result = await Subscription.find(
                        {
                            user: user._id,
                        },
                        { user: 0 }
                    );
                    result = JSON.parse(JSON.stringify(result));
                    let requests = [];
                    let subscriptions = [];
                    let courses = [];
                    for (const subscription of result) {
                        if (
                            subscription.state === "received" ||
                            subscription.state === "declined"
                        ) {
                            requests.push(subscription);
                        } else {
                            subscriptions.push(subscription);
                            courses.push(subscription);
                        }
                    }
                    return res.status(200).json({
                        user: user,
                        courses: courses,
                        subscriptions: subscriptions,
                        requests: requests,
                    });
                }
            );
        } catch (error) {
            return res.status(500).json({ error: error });
        }
    },
    updateUserInformationsByToken: async (req, res) => {
        try {
            let body = JSON.parse(JSON.stringify(req.body));
            //verify body of user update
            const bodyVerification = await userService.verifyBodyUpdateInfos(
                body
            );
            if (bodyVerification.error) {
                return res.status(400).json({
                    error: bodyVerification.error,
                });
            }
            User.findOne(
                {
                    _id: req.decode._id,
                    active: true,
                    confirmed: true,
                },
                { password: 0, refreshtoken: 0, google_id: 0 },
                async (error, user) => {
                    if (error) {
                        await errorHandler(req, res, error);
                    }
                    if (!user) {
                        return res
                            .status(404)
                            .json({ error: "User not found" });
                    }
                    await User.updateOne(
                        { _id: user._id },
                        {
                            firstname: body.firstname,
                            lastname: body.lastname,
                            phone: body.phone,
                        }
                    );
                    return res.status(200).json({
                        message: "User informations updated successfully",
                    });
                }
            );
        } catch (error) {
            return res.status(500).json({ error: error });
        }
    },
    updateUserEmailByToken: async (req, res) => {
        try {
            if (!req.body.email) {
                return res.status(400).json({ error: "Email is missing" });
            }
            User.findOne(
                {
                    _id: req.decode._id,
                    active: true,
                    confirmed: true,
                },
                { password: 0, refreshtoken: 0, google_id: 0 },
                async (error, user) => {
                    if (error) {
                        await errorHandler(req, res, error);
                    }
                    if (!user) {
                        return res
                            .status(404)
                            .json({ error: "User not found" });
                    }
                    user.email = req.body.email;
                    const jsontoken = sign(
                        { user },
                        process.env.JWT_ACC_ACTIVATE,
                        { expiresIn: "1h" }
                    );
                    //send confimation email
                    let msg = `<span>لتأكيد بريدكم الإلكتروني يرجي زيارة </span> <a href='https://client.thebravespirit.org/confirm-email/${jsontoken}'>تأكيد</a>`;
                    sendMail(user.email, msg, "Confirm The New Email");
                    await User.updateOne(
                        {
                            _id: req.decode._id,
                        },
                        {
                            confirmed: false,
                        }
                    );
                    return res
                        .status(200)
                        .json({ message: "Email verification is sent" });
                }
            );
        } catch (error) {
            return res.status(500).json({ error: error });
        }
    },
    updateUserPasswordByToken: async (req, res) => {
        try {
            let verifyBody = Joi.object()
                .keys({
                    old: Joi.string().required(),
                    password: Joi.string().required(),
                })
                .validate(req.body);
            if (verifyBody.error) {
                return {
                    error: verifyBody.error.details[0].message
                        .replace(/\\/g, "")
                        .replace(/"/g, "")
                        .split(":")[0],
                };
            }
            User.findOne(
                {
                    _id: req.decode._id,
                    active: true,
                    confirmed: true,
                },
                { refreshtoken: 0, google_id: 0 },
                async (error, user) => {
                    if (error) {
                        await errorHandler(req, res, error);
                    }
                    if (!user) {
                        return res
                            .status(404)
                            .json({ error: "User not found" });
                    }
                    let password = authService.resetPassword(
                        user,
                        req.body.password,
                        req.body.old
                    );
                    if (password === "password doesn't match") {
                        return res
                            .status(400)
                            .json({ error: "Password does not match" });
                    }
                    await User.updateOne(
                        {
                            _id: user._id,
                        },
                        {
                            password: password,
                        }
                    );
                    return res
                        .status(200)
                        .json({ message: "Password updated successfully" });
                }
            );
        } catch (error) {
            return res.status(500).json({ error: error });
        }
    },
    deleteUserByToken: async (req, res) => {
        try {
            User.findOne(
                {
                    _id: req.decode._id,
                    active: true,
                    confirmed: true,
                },
                { refreshtoken: 0, google_id: 0 },
                async (error, user) => {
                    if (error) {
                        await errorHandler(req, res, error);
                    }
                    if (!user) {
                        return res
                            .status(404)
                            .json({ error: "User not found" });
                    }
                    await User.updateOne(
                        {
                            _id: user._id,
                        },
                        {
                            active: false,
                        }
                    );
                    return res
                        .status(200)
                        .json({ message: "Your account has beed disabled." });
                }
            );
        } catch (error) {
            return res.status(500).json({ error: error });
        }
    },
    updateProfileImage: async (req, res) => {
        try {
            User.findOne(
                {
                    _id: req.decode._id,
                    active: true,
                    confirmed: true,
                },
                { _id: 1, image: 1 },
                async (error, user) => {
                    if (error) {
                        await errorHandler(req, res, error);
                    }
                    if (!user) {
                        return res
                            .status(404)
                            .json({ error: "User not found" });
                    }
                    if (!req.files.image) {
                        return res
                            .status(404)
                            .json({ error: "The image file is missing" });
                    }
                    if (user.image === "default.png") {
                        fs.copyFileSync(
                            req.files.image.path,
                            path.join(
                                __dirname,
                                `../../public/users/${user._id}${path.extname(
                                    req.files.image.name
                                )}`
                            )
                        );
                    } else {
                        fs.unlinkSync(
                            path.join(
                                __dirname,
                                `../../public/users/${user.image}`
                            )
                        );
                        fs.copyFileSync(
                            req.files.image.path,
                            path.join(
                                __dirname,
                                `../../public/users/${user._id}${path.extname(
                                    req.files.image.name
                                )}`
                            )
                        );
                    }
                    await User.updateOne(
                        {
                            _id: user._id,
                        },
                        {
                            image:
                                user._id + path.extname(req.files.image.name),
                        }
                    );
                    return res.status(200).json({
                        message:
                            "The profile image has been added successfully",
                    });
                }
            );
        } catch (error) {
            return res.status(500).json({ error: error });
        }
    },
    getProfileImage: async (req, res) => {
        try {
            User.findOne(
                {
                    _id: req.params.id,
                    active: true,
                    confirmed: true,
                },
                { _id: 0 },
                async (error, user) => {
                    if (error) {
                        await errorHandler(req, res, error);
                    }
                    if (!user) {
                        return res
                            .status(404)
                            .json({ error: "User not found" });
                    }
                    return res.sendFile(
                        path.join(
                            __dirname,
                            `../../public/users/${user.image}`
                        ),
                        (error) => {
                            if (error) {
                                return res.status(500).json({ error: error });
                            }
                        }
                    );
                }
            );
        } catch (error) {}
    },
};
