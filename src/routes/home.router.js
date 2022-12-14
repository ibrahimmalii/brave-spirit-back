const router = require("express").Router();
const {
    getHome,
    updateHome,
    getImage,
    resetHome,
    setAsDefault
} = require("../controllers/home.controller");
const formidable = require("../middlewares/Formidable");
const { checkToken, isAdmin } = require("../middlewares/Authorization");

//Home page router
router.get("/:target/:name", getImage);
router.get("/", getHome);
router.patch("/reset", checkToken, isAdmin, resetHome);
router.patch("/setAsDefault", checkToken, isAdmin, setAsDefault);
router.patch("/", formidable(), checkToken, isAdmin, updateHome);

module.exports = router;
