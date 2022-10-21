const { hashSync, genSaltSync, compareSync } = require("bcryptjs");
const jwt = require("jsonwebtoken");
const ALL_CHARS = "abcdefghijklmnopqrstuvwxyz";
const ALL_CHARS_MAJ = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const SPECIAL_CHARS = "@$!%*#?&";
const NUMBERS = "0123456789";
const Joi = require("joi");
const { User } = require("../models");

function verifyPassword(user, password) {
    return compareSync(password, user.password);
}

function shuffle(string) {
    string = string.split("");
    string = string.sort(() => Math.random() - 0.5);
    return string.join("");
}

module.exports = {
    verifyAuthenticationInformation: (user, password, res) => {
        //Compare password
        if (!verifyPassword(user, password)) return "password doesn't match";

        if (user.password) {
            user.password = undefined;
        }
        if (user.google_id) {
            user.google_id = undefined;
        }
        const jsontoken = jwt.sign(
            {
                user,
            },
            process.env.JWT_KEY,
            // { expiresIn: "1800s" }
        );
        const refreshtoken = jwt.sign(
            {
                user,
            },
            process.env.REFRESH_TOKEN_KEY
        );

        return {
            accesstoken: jsontoken,
            refreshtoken: refreshtoken,
            user,
        };
    },
    createTokenReset: async (user) => {
        if (user.password) {
            user.password = undefined;
        }
        if (user.google_id) {
            user.google_id = undefined;
        }
        const jsontoken = await jwt.sign(
            {
                user,
            },
            process.env.JWT_RESET_PASS,
            {
                // expiresIn: "1h",
            }
        );
        return {
            accesstoken: jsontoken,
            user,
        };
    },
    createToken: async (user) => {
        if (user.password) {
            user.password = undefined;
        }
        if (user.google_id) {
            user.google_id = undefined;
        }
        const jsontoken = jwt.sign(
            {
                user,
            },
            process.env.JWT_KEY,
            // { expiresIn: "1800s" }
        );
        return jsontoken;
    },
    createRefreshToken: async (user) => {
        if (user.password) {
            user.password = undefined;
        }
        if (user.google_id) {
            user.google_id = undefined;
        }
        const refreshtoken = jwt.sign(
            {
                user,
            },
            process.env.REFRESH_TOKEN_KEY,
            {}
        );
        return refreshtoken;
    },
    decodeToken: (token, key) => {
        return new Promise((resolve, reject) => {
            jwt.verify(token, key, (error, decode) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(decode);
                }
            });
        });
    },
    hashPassword: (password) => {
        //Hash password
        const salt = genSaltSync(10);
        password = hashSync(password, salt);
        return password;
    },
    resetPassword: (user, password, old) => {
        if (verifyPassword(user, old)) {
            return module.exports.hashPassword(password);
        } else {
            return "password doesn't match";
        }
    },
    randomPassword: async () => {
        var password = "";
        for (var i = 0; i < 5; ++i) {
            password += ALL_CHARS.charAt(
                Math.floor(Math.random() * ALL_CHARS.length)
            );
            if (i < 3) {
                password += NUMBERS.charAt(
                    Math.floor(Math.random() * NUMBERS.length)
                );
            }
        }
        return shuffle(password);
    },
    randomPasswordAdmin: async () => {
        var password = "";
        for (var i = 0; i < 5; ++i) {
            password += ALL_CHARS.charAt(
                Math.floor(Math.random() * ALL_CHARS.length)
            );
            if (i < 2) {
                password += ALL_CHARS_MAJ.charAt(
                    Math.floor(Math.random() * ALL_CHARS_MAJ.length)
                );
                password += NUMBERS.charAt(
                    Math.floor(Math.random() * NUMBERS.length)
                );
            }
            if (i < 3) {
                password += SPECIAL_CHARS.charAt(
                    Math.floor(Math.random() * SPECIAL_CHARS.length)
                );
            }
        }
        return shuffle(password);
    },
    verifyBodyRegister: async (body) => {
        let user = Joi.object()
            .keys({
                firstname: Joi.string().required(),
                lastname: Joi.string().required(),
                email: Joi.string()
                    .regex(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/)
                    .required(),
                phone: Joi.string()
                    .regex(/^(\+|00|0)[1-9][0-9 \-\(\)\.]{7,32}$/)
                    .optional(),
                password: Joi.string().min(8).required(),
                birthdate: Joi.date().optional(),
                country: Joi.string().optional(),
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
        if (
            Math.floor(
                Math.abs(new Date() - new Date(body.birthdate)) /
                    (1000 * 60 * 60 * 24 * 365)
            ) < 18
        ) {
            return {
                error: "You are under age, you should contact the admin for more informations",
            };
        }
        user = await User.findOne({ email: body.email });
        if (user) {
            return { error: "Email already exists" };
        }
        if (body.phone) {
            user = await User.findOne({ phone: body.phone });
            if (user) {
                return { error: "Phone number already exists" };
            }
        }
        return true;
    },
    verifyBodyRegisterGoogle: async (body) => {
        let user = Joi.object()
            .keys({
                firstname: Joi.string().required(),
                lastname: Joi.string().optional(),
                email: Joi.string()
                    .regex(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/)
                    .required(),
                phone: Joi.string()
                    .regex(/^(\+|00)[1-9][0-9 \-\(\)\.]{7,32}$/)
                    .optional(),
                google_id: Joi.string().required(),
                birthdate: Joi.date().optional(),
                country: Joi.string().optional(),
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
        // if (
        //     Math.floor(
        //         Math.abs(new Date() - new Date(body.birthdate)) /
        //             (1000 * 60 * 60 * 24 * 365)
        //     ) < 18
        // ) {
        //     return {
        //         error: "You are under age, you should contact the admin for more informations",
        //     };
        // }
        user = await User.findOne({ email: body.email });
        if (user) {
            return { error: "Email already exists" };
        }
        user = await User.findOne({ google_id: body.google_id });
        if (user) {
            return { error: "Google ID already exists" };
        }
        if (body.phone) {
            user = await User.findOne({ phone: body.phone });
            if (user) {
                return { error: "Phone number already exists" };
            }
        }
        return true;
    },
};
