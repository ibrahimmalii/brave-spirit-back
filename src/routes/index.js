const router = require("express").Router();

//Auth-Routes
const authRouter = require("./auth.router");
router.use("/", authRouter);

//Admin-Routes
const adminRouter = require("./admin.router");
router.use("/admin", adminRouter);

//Home-Routes
const homeRouter = require("./home.router");
router.use("/home", homeRouter);

//Users-Routes
const userRouter = require("./user.router");
router.use("/users", userRouter);

//Contacts-Routes
const contactRouter = require("./contact.router");
router.use("/contacts", contactRouter);

//Courses-Routes
const courseRouter = require("./course.router");
router.use("/courses", courseRouter);

//Subscriptions-Routes
const subscriptionRouter = require("./subscription.router");
router.use("/subscriptions", subscriptionRouter);

//Book-Routes
const bookRouter = require("./book.router");
router.use("/book", bookRouter);

module.exports = router;
