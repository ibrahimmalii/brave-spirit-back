const router = require("express").Router();
const {
    getSubscriptions,
    getSubscriptionsUser,
    getRequests,
    getRequestsUser,
    getSubscription,
    getRequest,
    getProof,
    createSubscription,
    createSubscriptionRequest,
    confirmSubscriptionRequest,
    declineSubscriptionRequest,
} = require("../controllers/subscription.controller");
const { checkToken, isAdmin } = require("../middlewares/Authorization");
const formidable = require("../middlewares/Formidable");

//Subscription router
router.get("/", checkToken, isAdmin, getSubscriptions);
router.get("/user", checkToken, getSubscriptionsUser);
router.get("/requests", checkToken, isAdmin, getRequests);
router.get("/user/requests", checkToken, getRequestsUser);
router.get("/:id", checkToken, isAdmin, getSubscription);
router.get("/request/:id", checkToken, isAdmin, getRequest);
router.get("/proof/:id", checkToken, isAdmin, getProof);
router.get("/confirm/:id", checkToken, isAdmin, confirmSubscriptionRequest);
router.get("/decline/:id", checkToken, isAdmin, declineSubscriptionRequest);
router.post("/", checkToken, createSubscription);
router.post("/request", formidable(), checkToken, createSubscriptionRequest);

module.exports = router;
