const { Course, Subscription } = require("../models");
const subscriptionService = require("../services/subscription.service");
const { errorHandler } = require("../services/errorHandler");
const fs = require("fs");
const path = require("path");
const { sendMail } = require("../services/mail.service");
const { cipherDecrypt } = require("../services/crypto.service");
module.exports = {
    getSubscriptions: async (req, res) => {
        try {
            // find all subscriptions that have the state completed and Declined
            // because the received state is for the requests
            Subscription.find(
                { $or: [{ state: "completed" }, { state: "error" }] },
                async (error, subscriptions) => {
                    if (error) {
                        await errorHandler(req, res, error);
                    }
                    return res.status(200).json(subscriptions);
                }
            );
        } catch (error) {
            return res.status(500).json({ error: error });
        }
    },
    getSubscriptionsUser: async (req, res) => {
        try {
            // find all subscriptions that have the state completed and Declined for the current user
            // because the received state is for the requests
            Subscription.find(
                {
                    user: req.decode._id,
                    state: "completed",
                },
                async (error, subscriptions) => {
                    if (error) {
                        await errorHandler(req, res, error);
                    }
                    return res.status(200).json(subscriptions);
                }
            );
        } catch (error) {
            return res.status(500).json({ error: error });
        }
    },
    getRequests: async (req, res) => {
        // find all subscriptions that have received state
        try {
            Subscription.find(
                { $or: [{ state: "received" }, { state: "declined" }] },
                async (error, subscriptions) => {
                    if (error) {
                        await errorHandler(req, res, error);
                    }
                    return res.status(200).json(subscriptions);
                }
            );
        } catch (error) {
            return res.status(500).json({ error: error });
        }
    },
    getRequestsUser: async (req, res) => {
        try {
            // find all subscriptions that have the state completed and Declined for the current user
            // because the received state is for the requests
            Subscription.find(
                {
                    user: req.decode._id,
                    $or: [{ state: "received" }, { state: "declined" }],
                },
                async (error, subscriptions) => {
                    if (error) {
                        await errorHandler(req, res, error);
                    }
                    return res.status(200).json(subscriptions);
                }
            );
        } catch (error) {
            return res.status(500).json({ error: error });
        }
    },
    getSubscription: async (req, res) => {
        try {
            Subscription.findOne(
                {
                    _id: req.params.id,
                    $or: [{ state: "completed" }, { state: "declined" }],
                },
                async (error, subscription) => {
                    if (error) {
                        await errorHandler(req, res, error);
                    }
                    if (!subscription) {
                        return res
                            .status(404)
                            .json({ error: "Subscription not found" });
                    }
                    return res.status(200).json(subscription);
                }
            );
        } catch (error) {
            return res.status(500).json({ error: error });
        }
    },
    getRequest: async (req, res) => {
        try {
            Subscription.findOne(
                { _id: req.params.id, state: "received" },
                async (error, subscription) => {
                    if (error) {
                        await errorHandler(req, res, error);
                    }
                    if (!subscription) {
                        return res
                            .status(404)
                            .json({ error: "Request not found" });
                    }
                    return res.status(200).json(subscription);
                }
            );
        } catch (error) {
            return res.status(500).json({ error: error });
        }
    },
    getProof: async (req, res) => {
        try {
            //verify that it is a request by checking if the field request exists
            Subscription.findOne(
                { _id: req.params.id, request: { $exists: true } },
                async (error, subscription) => {
                    if (error) {
                        await errorHandler(req, res, error);
                    }
                    if (!subscription) {
                        return res
                            .status(404)
                            .json({ error: "Request not found" });
                    }
                    //verify that the file was received successfully
                    if (
                        !fs.existsSync(
                            path.join(
                                __dirname,
                                `../../public/requests/${subscription.id}/${subscription.request.file}`
                            )
                        )
                    ) {
                        return res
                            .status(404)
                            .json({ error: "Proof file not found" });
                    }
                    return res.sendFile(
                        path.join(
                            __dirname,
                            `../../public/requests/${subscription.id}/${subscription.request.file}`
                        ),
                        (error) => {
                            if (error) {
                                return res.status(500).json({ error: error });
                            }
                        }
                    );
                }
            );
        } catch (error) {
            return res.status(500).json({ error: error });
        }
    },
    createSubscription: async (req, res) => {
        try {
            let body = await cipherDecrypt(req.body.data);
            body = JSON.parse(body);

            //get the user from the token
            body.user = req.decode._id;
            let course = await Course.findOne({ _id: body.course });
            if (!course) {
                return res.status(404).json({
                    error: "Course not found",
                });
            }
            //get the price from the course and calculate it with the discount if it exists
            body.price = {};
            if (course.discount > 0) {
                body.price.euro =
                    course.price.euro -
                    (course.price.euro * course.discount) / 100;
                body.price.dzd =
                    course.price.dzd -
                    (course.price.dzd * course.discount) / 100;
            } else {
                body.price = course.price;
            }
            //verify body of the creation
            const bodyVerification =
                await subscriptionService.verifyBodyCreation(body);
            if (bodyVerification.error) {
                return res.status(400).json({
                    error: bodyVerification.error,
                });
            }
            Subscription.create(body, async (error, subscription) => {
                if (error) {
                    await errorHandler(req, res, error);
                }
                return res.status(200).json(subscription);
            });
        } catch (error) {
            return res.status(500).json({ error: error });
        }
    },
    createSubscriptionRequest: async (req, res) => {
        try {
            let body = JSON.parse(fs.readFileSync(req.files["data"].path));

            //get the user from the token
            body.user = req.decode._id;
            let course = await Course.findOne({ _id: body.course });
            if (!course) {
                return {
                    error: "Course not found",
                };
            }
            body.price = {
                euro: 0,
                dzd: 0,
            };
            //get the price from the course and calculate it with the discount if it exists
            if (course.discount > 0) {
                body.price.euro =
                    course.price.euro -
                    (course.price.euro * course.discount) / 100;

                body.price.dzd =
                    course.price.dzd -
                    (course.price.dzd * course.discount) / 100;
            } else {
                body.price = course.price;
            }
            //force the state to be received to differentiate the request from the subscription
            body.state = "received";
            //verify body of the creation
            const bodyVerification =
                await subscriptionService.verifyBodyRequest(body);
            if (bodyVerification.error) {
                return res.status(400).json({
                    error: bodyVerification.error,
                });
            }
            Subscription.create(body, async (error, subscription) => {
                if (error) {
                    await errorHandler(req, res, error);
                }
                //create the special directory for the proof file
                if (
                    !fs.existsSync(
                        path.join(
                            __dirname,
                            `../../public/requests/${subscription._id}`
                        )
                    )
                ) {
                    fs.mkdirSync(
                        path.join(
                            __dirname,
                            `../../public/requests/${subscription._id}`
                        )
                    );
                }
                //copy the file on the directory that has the id of the subscription
                if (req.files) {
                    if (req.files.proof) {
                        fs.copyFileSync(
                            req.files.proof.path,
                            path.join(
                                __dirname,
                                `../../public/requests/${subscription._id}/${body.request.file}`
                            )
                        );
                    }
                }

                return res.status(200).json(subscription);
            });
        } catch (error) {
            return res.status(500).json({ error: error });
        }
    },
    confirmSubscriptionRequest: async (req, res) => {
        try {
            Subscription.findOne(
                { _id: req.params.id, state: "received" },
                async (error, subscription) => {
                    if (error) {
                        await errorHandler(req, res, error);
                    }
                    if (!subscription) {
                        return res.status(404).json({
                            error: "Request not found or has been already confirmed or declined",
                        });
                    }
                    console.log(subscription.request.type === "cib");
                    if (subscription.request.type === "cib") {
                        await Subscription.updateOne(
                            { _id: subscription._id },
                            {
                                method: "cib",
                                state: "completed",
                            }
                        );
                    } else {
                        await Subscription.updateOne(
                            { _id: subscription._id },
                            {
                                method: "free",
                                state: "completed",
                            }
                        );
                    }
                    //send confimation email
                    let msg = `<span>   الدورة ${subscription.course.name.ar} متاحة الآن في حسابك</span>`;
                    sendMail(subscription.user.email, msg, "Request Confirmed");
                    return res.status(200).json({
                        message: "Request confirmed successfully",
                    });
                }
            );
        } catch (error) {
            return res.status(500).json({ error: error });
        }
    },
    declineSubscriptionRequest: async (req, res) => {
        try {
            Subscription.findOne(
                { _id: req.params.id, state: "received" },
                async (error, subscription) => {
                    if (error) {
                        await errorHandler(req, res, error);
                    }
                    if (!subscription) {
                        return res.status(404).json({
                            error: "Request not found or has been already or declined",
                        });
                    }
                    await Subscription.updateOne(
                        { _id: subscription._id },
                        {
                            state: "declined",
                        }
                    );
                    //send confimation email
                    let msg = `<span>للأسف ، قررنا رفض طلبك للدورة ${subscription.course.name.ar}.لأن السبب الذي قدمته لم يكن مقنعًا لنا</span>`;
                    sendMail(subscription.user.email, msg, "Request Declined");
                    return res.status(200).json({
                        message: "Request declined successfully",
                    });
                }
            );
        } catch (error) {
            return res.status(500).json({ error: error });
        }
    },
};
