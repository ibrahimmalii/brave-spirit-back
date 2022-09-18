const router = require("express").Router();
const {
    getHome,
    updateHome,
    getImage,
} = require("../controllers/home.controller");
const formidable = require("../middlewares/Formidable");
const { checkToken, isAdmin } = require("../middlewares/Authorization");

//Home page router
router.get("/:target/:name", getImage);
router.get("/", getHome);
router.patch("/", formidable(), checkToken, isAdmin, updateHome);

module.exports = router;
