const router = require("express").Router();
const {
    getBookDownloads,
    sendBook,
} = require("../controllers/book.controller");

//Book router
router.get("/", getBookDownloads);
router.post("/", sendBook);

module.exports = router;
