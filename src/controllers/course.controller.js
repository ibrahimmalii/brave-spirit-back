const { Course, Subscription, Contact } = require("../models");
const courseService = require("../services/course.service");
const { errorHandler } = require("../services/errorHandler");
const fs = require("fs");
const path = require("path");

module.exports = {
    getCourses: async (req, res) => {
        try {
            Course.find(
                {},
                { name: 1, published: 1, get_free: 1 },
                async (error, courses) => {
                    if (error) {
                        await errorHandler(req, res, error);
                    }
                    return res.status(200).json(courses);
                }
            );
        } catch (error) {
            return res.status(500).json({ error: error });
        }
    },
    getDeletedCourses: async (req, res) => {
        try {
            let { size, page } = req.query;
            size = size != null ? +req.query.size : 1;
            Course.find(
                { published: false },
                {},
                {
                    skip: (page != null ? page - 1 : 0) * size,
                    limit: size,
                    sort: {
                        createdAt: 1,
                    },
                },
                async (error, courses) => {
                    if (error) {
                        await errorHandler(req, res, error);
                    }
                    return res.status(200).json(courses);
                }
            );
        } catch (error) {
            return res.status(500).json({ error: error });
        }
    },
    getCoursesPublic: async (req, res) => {
        try {
            Course.find(
                { published: true },
                {
                    name: 1,
                    price: 1,
                    zipped_description: 1,
                    description: 1,
                    cover: 1,
                    images: 1,
                    chapters: {
                        title: 1,
                        files: {
                            title: 1,
                        },
                    },
                },
                async (error, courses) => {
                    if (error) {
                        await errorHandler(req, res, error);
                    }
                    if (!courses) {
                        return res
                            .status(404)
                            .json({ error: "No courses found" });
                    }
                    return res.status(200).json(courses);
                }
            );
        } catch (error) {
            return res.status(500).json({ error: error });
        }
    },
    getCourseDetailsUser: async (req, res) => {
        try {
            const subscription = await Subscription.findOne({
                course: req.params.id,
                user: req.decode._id,
                state: "completed",
            });
            if (!subscription) {
                return res
                    .status(404)
                    .json({ error: "You are not subscribed to this course." });
            }
            let course = await Course.findOne(
                { _id: req.params.id },
                { "chapters._id": 0, "chapters.files._id": 0 }
            );
            const contacts = await Contact.find({
                courseName: course.name.ar,
                archived: true,
            });
            course.faqs = contacts.length > 0 ? contacts : [];
            return res.status(200).json(course);
        } catch (error) {
            return res.status(500).json({ error: error });
        }
    },
    getCourseDetailsPublic: async (req, res) => {
        try {
            const course = await Course.findOne(
                {
                    _id: req.params.id,
                    published: true,
                },
                {
                    name: 1,
                    price: 1,
                    zipped_description: 1,
                    description: 1,
                    cover: 1,
                    images: 1,
                    chapters: {
                        title: 1,
                        files: {
                            title: 1,
                        },
                    },
                    discount: 1,
                }
            );
            if (!course) {
                return res.status(404).json({ error: "No course found" });
            }
            return res.status(200).json(course);
        } catch (error) {
            return res.status(500).json({ error: error });
        }
    },
    getCourseDetailsAdmin: async (req, res) => {
        try {
            Course.findOne(
                { _id: req.params.id },
                { "chapters._id": 0, "chapters.files._id": 0 },
                async (error, course) => {
                    if (error) {
                        await errorHandler(req, res, error);
                    }
                    if (!course) {
                        return res
                            .status(404)
                            .json({ error: "No course found" });
                    }
                    let subscriptions = await Subscription.find({
                        course: req.params.id,
                        state: { $ne: "received" },
                    });
                    let requests = await Subscription.find({
                        course: req.params.id,
                        state: "received",
                    });
                    const users = subscriptions.length
                        ? subscriptions.map((subscription) => {
                              return subscription.user;
                          })
                        : [];

                    return res.status(200).json({
                        course: course,
                        users: users,
                        requests: requests.length > 0 ? requests : [],
                        subscriptions: subscriptions.length
                            ? subscriptions
                            : [],
                    });
                }
            );
        } catch (error) {
            return res.status(500).json({ error: error });
        }
    },
    createCourse: async (req, res) => {
        try {
            let body = JSON.parse(fs.readFileSync(req.files["data"].path));

            //verify body of the creation
            const bodyVerification = await courseService.verifyBodyCreation(
                body
            );
            if (bodyVerification.error) {
                return res.status(400).json({
                    error: bodyVerification.error,
                });
            }
            Course.create(body, async (error, course) => {
                if (error) {
                    await errorHandler(req, res, error);
                }
                //create the course directory and all the necessary directory inside
                await courseService.createFolders(course._id);

                //copy the cover first
                if (req.files.cover) {
                    fs.copyFile(
                        req.files.cover.path,
                        path.join(
                            __dirname,
                            `../../public/courses/${course._id}/cover`,
                            body.cover
                        ),
                        (error) => {
                            if (error) {
                                console.log({
                                    error: `Error on copying the cover`,
                                });
                            }
                        }
                    );
                } else {
                    try{
                        fs.rmdirSync(path.join(
                            __dirname,
                            `../../public/courses/${course._id}`
                        ), {recursive: true});
                        await Course.remove({ _id: course._id });
                    } catch (error) {
                        return res
                        .status(500)
                        .json({ message: "The course can not be deleted." });
                    }
                    return res
                        .status(400)
                        .json({ error: "The cover file is missing" });
                }
                //loop over images and copy them on their directory
                let index = 0;
                for (const key in req.files) {
                    if (key.includes("image")) {
                        fs.copyFile(
                            req.files[key].path,
                            path.join(
                                __dirname,
                                `../../public/courses/${course._id}/images/${body.images[index]}`
                            ),
                            (error) => {
                                if (error) {
                                    console.log({
                                        error: `Error on copying the image ${key}`,
                                    });
                                }
                            }
                        );
                        index++;
                    }
                    if (key.includes("attachment")) {
                        fs.copyFile(
                            req.files[key].path,
                            path.join(
                                __dirname,
                                `../../public/courses/${
                                    course._id
                                }/attachments/${
                                    body.chapters[key[key.length - 3]].files[
                                        key[key.length - 2]
                                    ].attachments[key[key.length - 1]]
                                }`
                            ),
                            (error) => {
                                if (error) {
                                    console.log({
                                        error: `Error on copying the attachment ${key}`,
                                    });
                                }
                            }
                        );
                    }
                }
                return res.status(200).json(course);
            });
        } catch (error) {
            return res.status(500).json({ error: error });
        }
    },
    updateCourse: async (req, res) => {
        try {
            let body = JSON.parse(fs.readFileSync(req.files["data"].path));
            //verify body of the creation
            const bodyVerification = await courseService.verifyUpdate(
                body,
                req.params.id
            );
            if (bodyVerification.error) {
                return res.status(400).json({
                    error: bodyVerification.error,
                });
            }
            Course.findOne({ _id: req.params.id }, async (error, course) => {
                if (error) {
                    await errorHandler(req, res, error);
                }
                if (!course) {
                    return res.status(404).json({ error: "Course not found" });
                }
                await Course.updateOne({ _id: course._id }, body);
                //create the course directory and all the necessary directory inside
                await courseService.createFolders(course._id);

                //copy the cover first
                if (req.files.cover) {
                    fs.copyFile(
                        req.files.cover.path,
                        path.join(
                            __dirname,
                            `../../public/courses/${course._id}/cover`,
                            body.cover
                        ),
                        (error) => {
                            if (error) {
                                console.log({
                                    error: `Error on copying the cover`,
                                });
                            }
                        }
                    );
                }

                //loop over images and copy them on their directory
                let index = 0;
                for (const key in req.files) {
                    if (key.includes("image")) {
                        fs.copyFile(
                            req.files[key].path,
                            path.join(
                                __dirname,
                                `../../public/courses/${course._id}/images/${body.images[index]}`
                            ),
                            (error) => {
                                if (error) {
                                    console.log({
                                        error: `Error on copying the image ${key}`,
                                    });
                                }
                            }
                        );
                        index++;
                    }
                    if (key.includes("attachment")) {
                        fs.copyFile(
                            req.files[key].path,
                            path.join(
                                __dirname,
                                `../../public/courses/${
                                    course._id
                                }/attachments/${
                                    body.chapters[key[key.length - 3]].files[
                                        key[key.length - 2]
                                    ].attachments[key[key.length - 1]]
                                }`
                            ),
                            (error) => {
                                if (error) {
                                    console.log({
                                        error: `Error on copying the attachment ${key}`,
                                    });
                                }
                            }
                        );
                    }
                }
                return res
                    .status(200)
                    .json({ message: "Course updated successfully" });
            });
        } catch (error) {
            return res.status(500).json({ error: error });
        }
    },
    publishUnpublishCourse: async (req, res) => {
        try {
            Course.findOne({ _id: req.params.id }, async (error, course) => {
                if (error) {
                    await errorHandler(req, res, error);
                }
                if (!course) {
                    return res.status(404).json({ error: "Course not found" });
                }
                await Course.updateOne(
                    { _id: req.params.id },
                    { published: !course.published }
                );
                let message = course.published ? "Course unpublished successfully" : "Course published successfully";
                return res
                        .status(200)
                        .json({ message});
            });
        } catch (error) {
            return res.status(500).json({ error: error });
        }
    },
    freeOrPaidCourse: async (req, res) => {
        try {
            Course.findOne({_id: req.params.id}, async (error, course) => {
                if (error) {
                    await errorHandler(req, res, error);
                }
                if (!course) {
                    return res.status(404).json({ error: "Course not found" });
                }
                await Course.updateOne(
                    {_id: req.params.id},
                    {get_free: !course.get_free}
                );
                let message = course.get_free ? "Course can't get for free" : "Course can get for free";
                return res
                        .status(200)
                        .json({ message});
            })
        } catch (error) {
            return res.status(500).json({ error });
        }
    },
    getCourseAttachments: async (req, res) => {
        try {
            const subscription = await Subscription.findOne({
                course: req.params.id,
                user: req.decode._id,
                state: "completed",
            });

            if (!subscription) {
                return res
                    .status(200)
                    .json({ error: "you can't access this file !" });
            }

            if (
                !fs.existsSync(
                    path.join(
                        __dirname,
                        `../../public/courses/${req.params.id}/attachments/${req.params.file}`
                    )
                )
            ) {
                return res.status(404).json({ error: "Attachment not found" });
            }
            return res.sendFile(
                path.join(
                    __dirname,
                    `../../public/courses/${req.params.id}/attachments/${req.params.file}`
                ),
                (error) => {
                    if (error) {
                        return res.status(500).json({ error: error });
                    }
                }
            );
        } catch (error) {
            return res.status(500).json({ error: error });
        }
    },
    getCourseAttachmentsAdmin: async (req, res) => {
        try {
            if (
                !fs.existsSync(
                    path.join(
                        __dirname,
                        `../../public/courses/${req.params.id}/attachments/${req.params.file}`
                    )
                )
            ) {
                return res.status(404).json({ error: "Attachment not found" });
            }
            return res.sendFile(
                path.join(
                    __dirname,
                    `../../public/courses/${req.params.id}/attachments/${req.params.file}`
                ),
                (error) => {
                    if (error) {
                        return res.status(500).json({ error: error });
                    }
                }
            );
        } catch (error) {
            return res.status(500).json({ error: error });
        }
    },
    getCourseCover: async (req, res) => {
        try {
            if (
                !fs.existsSync(
                    path.join(
                        __dirname,
                        `../../public/courses/${req.params.id}/cover/${req.params.file}`
                    )
                )
            ) {
                return res.status(404).json({ error: "Cover not found" });
            }
            return res.sendFile(
                path.join(
                    __dirname,
                    `../../public/courses/${req.params.id}/cover/${req.params.file}`
                ),
                (error) => {
                    if (error) {
                        console.log(error);
                        return res.status(500).json({ error: error });
                    }
                }
            );
        } catch (error) {
            console.log(error);
            return res.status(500).json({ error: error });
        }
    },
    getCourseImage: async (req, res) => {
        try {
            if (
                !fs.existsSync(
                    path.join(
                        __dirname,
                        `../../public/courses/${req.params.id}/images/${req.params.file}`
                    )
                )
            ) {
                return res.status(404).json({ error: "Image not found" });
            }
            return res.sendFile(
                path.join(
                    __dirname,
                    `../../public/courses/${req.params.id}/images/${req.params.file}`
                ),
                (error) => {
                    if (error) {
                        return res.status(500).json({ error: error });
                    }
                }
            );
        } catch (error) {
            return res.status(500).json({ error: error });
        }
    },
    deleteCourse: async (req, res) => {
        try {
            Course.findOne(
                {
                    _id: req.params.id,
                },
                async (error, course) => {
                    if (error) {
                        await errorHandler(req, res, error);
                    }
                    if (!course) {
                        return res
                            .status(404)
                            .json({ error: "course not found" });
                    }
                    try{
                        fs.rmdirSync(path.join(
                            __dirname,
                            `../../public/courses/${course._id}`
                        ), {recursive: true});
                        await Course.deleteOne(
                            {
                                _id: course._id,
                            }
                        );
                    } catch (error) {
                        return res
                        .status(500)
                        .json({ message: "The course can not be deleted." });
                    }
                    
                    return res
                        .status(200)
                        .json({ message: "The course has beed deleted." });
                }
            );
        } catch (error) {
            return res.status(500).json({ error: error });
        }
    }
};
