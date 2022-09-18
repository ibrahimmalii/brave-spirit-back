const router = require("express").Router();
const {
    login,
    refreshToken,
    logout,
    generateNewPassword,
    getAdmin,
} = require("../controllers/admin.controller");
const { checkToken, isAdmin } = require("../middlewares/Authorization");

//Admin router
router.get("/", checkToken, isAdmin, getAdmin);
router.post("/login", login);
router.get("/logout", checkToken, isAdmin, logout);
router.post("/refreshtoken", refreshToken);
router.get("/password", generateNewPassword);

module.exports = router;
