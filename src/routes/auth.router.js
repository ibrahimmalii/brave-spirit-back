const router = require("express").Router();
const {
    verifyUserEmail,
    login,
    loginGoogle,
    register,
    registerGoogle,
    refreshToken,
    forgetPassword,
    logout,
} = require("../controllers/auth.controller");
const { checkToken } = require("../middlewares/Authorization");

//Auth router
router.get("/verify", verifyUserEmail);
router.get("/logout", checkToken, logout);
router.post("/login", login);
router.post("/login/google", loginGoogle);
router.post("/register", register);
router.post("/register/google", registerGoogle);
router.post("/refreshtoken", refreshToken);
router.post("/forget", forgetPassword);

module.exports = router;
