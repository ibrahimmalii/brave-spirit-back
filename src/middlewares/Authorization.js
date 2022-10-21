require("dotenv").config();
const Auth = require("../services/auth.service");
const { Admin } = require("../models");
const { errorHandler } = require("../services/errorHandler");

module.exports = {
    checkToken: async (req, res, next) => {
        console.log("Checking");
        try {
            let token = req.get("authorization");
            if (token) {
                token = token.slice(7);
                await Auth.decodeToken(token, process.env.JWT_KEY)
                    .then(async (decode) => {
                        if (!decode) {
                            return res.status(403).json({
                                error: "Access Denied! Token is not valid",
                            });
                        } else {
                            req.decode = decode.user;
                            next();
                        }
                    })
                    .catch((error) => {
                        return res.status(401).json({
                            error: error.message,
                        });
                    });
            } else {
                return res.status(403).json({
                    error: "Accés Denied! Token missing.",
                });
            }
        } catch (error) {
            return res.status(500).json({
                error: error,
            });
        }
    },
    isAdmin: async (req, res, next) => {
        console.log("isAdmin");
        try {
            if (req.decode) {
                Admin.findOne({ _id: req.decode._id }, async (error, admin) => {
                    if (error) {
                        await errorHandler(req, res, error);
                    }
                    if (!admin) {
                        return res.status(403).json({
                            error: "Accés Denied! User not authorized.",
                        });
                    }
                    next();
                });
            } else {
                return res.status(403).json({
                    error: "Accés Denied! User not found.",
                });
            }
        } catch (error) {
            return res.status(500).json({
                error: error,
            });
        }
    },
};
