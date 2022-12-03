const Joi = require("joi");
const { Course } = require("../models");
const fs = require("fs");
const path = require("path");
const { optional } = require("joi");

module.exports = {
    verifyBodyCreation: async (body) => {
        let course = Joi.object()
            .keys({
                name: Joi.object({
                    ar: Joi.string().required(),
                    en: Joi.string().allow(null, "").optional(),
                }),
                description: Joi.object({
                    ar: Joi.string().required(),
                    en: Joi.string().allow(null, "").optional(),
                }).required(),
                zipped_description: Joi.object({
                    ar: Joi.string().required(),
                    en: Joi.string().allow(null, "").optional(),
                }).required(),
                cover: Joi.string().required(),
                // cover: Joi.optional(),
                images: Joi.array()
                    .items(Joi.string())
                    .allow(null, "")
                    .optional(),
                chapters: Joi.array()
                    .items(
                        Joi.object({
                            title: Joi.object({
                                ar: Joi.string().required(),
                                en: Joi.string().allow(null, "").optional(),
                            }),
                            description: Joi.object({
                                ar: Joi.string().required(),
                                en: Joi.string().allow(null, "").optional(),
                            }).optional(),
                            files: Joi.array()
                                .items(
                                    Joi.object({
                                        title: Joi.object({
                                            ar: Joi.string().required(),
                                            en: Joi.string()
                                                .allow(null, "")
                                                .optional(),
                                        }),
                                        link: Joi.string().optional(),
                                        file: Joi.string().optional(),
                                        attachments: Joi.array()
                                            .items(Joi.string())
                                            .optional(),
                                    })
                                )
                                .optional(),
                        })
                    )
                    .required(),
                price: Joi.object({
                    euro: Joi.number().required(),
                    dzd: Joi.number().required(),
                }).required(),
                discount: Joi.number().optional(),
                published: Joi.boolean().optional(),
                get_free: Joi.boolean().optional(),
            })
            .validate(body);

        if (course.error) {
            return {
                error: course.error.details[0].message
                    .replace(/\\/g, "")
                    .replace(/"/g, "")
                    .split(":")[0],
            };
        }

        if (body.name.en) {
            course = await Course.findOne({
                $or: [{ "name.ar": body.name.ar }, { "name.en": body.name.en }],
            });
            if (course) {
                return {
                    error: "The name of the course exists already",
                };
            }
        } else {
            course = await Course.findOne({ "name.ar": body.name.ar });
            if (course) {
                return {
                    error: "The arabic name of the course exists already",
                };
            }
        }

        return true;
    },
    createFolders: async (id) => {
        //verify if the folders don't exist so we create them
        if (
            !fs.existsSync(
                path.join(__dirname, `../../public/courses/${id}`)
            )
        ) {
            fs.mkdirSync(
                path.join(__dirname, `../../public/courses/${id}`)
            );
        }
        if (
            !fs.existsSync(
                path.join(
                    __dirname,
                    `../../public/courses/${id}/images`
                )
            )
        ) {
            fs.mkdirSync(
                path.join(
                    __dirname,
                    `../../public/courses/${id}/images`
                )
            );
        }
        if (
            !fs.existsSync(
                path.join(__dirname, `../../public/courses/${id}/cover`)
            )
        ) {
            fs.mkdirSync(
                path.join(__dirname, `../../public/courses/${id}/cover`)
            );
        }
        if (
            !fs.existsSync(
                path.join(
                    __dirname,
                    `../../public/courses/${id}/attachments`
                )
            )
        )
            fs.mkdirSync(
                path.join(
                    __dirname,
                    `../../public/courses/${id}/attachments`
                )
            );
    },
    verifyUpdate: async (body,id) => {
        let course = Joi.object()
            .keys({
                name: Joi.object({
                    ar: Joi.string().required(),
                    en: Joi.string().allow(null, "").optional(),
                }),
                description: Joi.object({
                    ar: Joi.string().required(),
                    en: Joi.string().allow(null, "").optional(),
                }).required(),
                zipped_description: Joi.object({
                    ar: Joi.string().required(),
                    en: Joi.string().allow(null, "").optional(),
                }).required(),
                cover: Joi.string().required(),
                images: Joi.array()
                    .items(Joi.string())
                    .allow(null, "")
                    .optional(),
                chapters: Joi.array()
                    .items(
                        Joi.object({
                            title: Joi.object({
                                ar: Joi.string().required(),
                                en: Joi.string().allow(null, "").optional(),
                            }),
                            description: Joi.object({
                                ar: Joi.string().required(),
                                en: Joi.string().allow(null, "").optional(),
                            }).optional(),
                            files: Joi.array()
                                .items(
                                    Joi.object({
                                        title: Joi.object({
                                            ar: Joi.string().required(),
                                            en: Joi.string()
                                                .allow(null, "")
                                                .optional(),
                                        }),
                                        link: Joi.string().optional(),
                                        file: Joi.string().optional(),
                                        attachments: Joi.array()
                                            .items(Joi.string())
                                            .optional(),
                                    })
                                )
                                .optional(),
                        })
                    )
                    .required(),
                price: Joi.object({
                    euro: Joi.number().required(),
                    dzd: Joi.number().required(),
                }).required(),
                discount: Joi.number().optional(),
                published: Joi.boolean().optional(),
                get_free: Joi.boolean().optional(),
            })
            .validate(body);

        if (course.error) {
            return {
                error: course.error.details[0].message
                    .replace(/\\/g, "")
                    .replace(/"/g, "")
                    .split(":")[0],
            };
        }

        if (body.name.en) {
            course = await Course.findOne({
                $or: [{ "name.ar": body.name.ar }, { "name.en": body.name.en }],
                _id: { $ne: id },
            });
            if (course) {
                return {
                    error: "The name of the course exists already",
                };
            }
        } else {
            course = await Course.findOne({
                "name.ar": body.name.ar,
                _id: { $ne: id },
            });
            if (course) {
                return {
                    error: "The arabic name of the course exists already",
                };
            }
        }

        return true;
    },
};
