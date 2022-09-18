const router = require("express").Router();
const {
    getContacts,
    getContact,
    createContact,
    archiveContact,
    answerContact,
} = require("../controllers/contact.controller");
const { checkToken, isAdmin } = require("../middlewares/Authorization");

//Contact router
router.get("/", checkToken, isAdmin, getContacts);
router.get("/:id", checkToken, isAdmin, getContact);
router.post("/", createContact);
router.patch("/answer/:id", checkToken, isAdmin, answerContact);
router.patch("/archive/:id", checkToken, isAdmin, archiveContact);

module.exports = router;
