const router = require("express").Router();
const {
    getUsers,
    getDeletedUsers,
    getUser,
    createUser,
    updateUser,
    changeStateUser,
    getUserByToken,
    updateUserInformationsByToken,
    updateUserEmailByToken,
    updateUserPasswordByToken,
    getProfileImage,
    updateProfileImage,
} = require("../controllers/user.controller");
const { checkToken, isAdmin } = require("../middlewares/Authorization");
const formidable = require("../middlewares/Formidable");

//User router
router.get("/", checkToken, isAdmin, getUsers);
router.get("/deleted", checkToken, isAdmin, getDeletedUsers);
router.get("/account", checkToken, getUserByToken);
router.get("/image/:id", getProfileImage);
router.get("/:id", checkToken, isAdmin, getUser);
router.post("/", checkToken, isAdmin, createUser);
router.patch("/image", formidable(), checkToken, updateProfileImage);
router.patch("/infos", checkToken, updateUserInformationsByToken);
router.patch("/email", checkToken, updateUserEmailByToken);
router.patch("/password", checkToken, updateUserPasswordByToken);
router.patch("/:id", checkToken, isAdmin, updateUser);
router.delete("/:id", checkToken, isAdmin, changeStateUser);

module.exports = router;
