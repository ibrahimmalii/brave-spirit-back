const router = require("express").Router();
const {
    getCourses,
    getDeletedCourses,
    getCoursesPublic,
    getCourseDetailsPublic,
    getCourseDetailsUser,
    getCourseDetailsAdmin,
    createCourse,
    updateCourse,
    deleteCourse,
    publishUnpublishCourse,
    getCourseAttachments,
    getCourseCover,
    getCourseImage,
    getCourseAttachmentsAdmin,
} = require("../controllers/course.controller");
const { checkToken, isAdmin } = require("../middlewares/Authorization");
const formidable = require("../middlewares/Formidable");

//Course router
router.get("/", checkToken, isAdmin, getCourses);
router.get("/deleted", checkToken, isAdmin, getDeletedCourses);
router.get("/public", getCoursesPublic);
router.get("/cover/:id/:file", getCourseCover);
router.get("/image/:id/:file", getCourseImage);
router.get("/public/:id", getCourseDetailsPublic);
router.get("/user/:id", checkToken, getCourseDetailsUser);
router.get("/user/attachment/:id/:file", checkToken, getCourseAttachments);
router.get("/attachment/:id/:file", checkToken, isAdmin, getCourseAttachmentsAdmin);
router.get("/:id", checkToken, isAdmin, getCourseDetailsAdmin);
router.post("/", formidable(), checkToken, isAdmin, createCourse);
router.patch("/publish/:id", checkToken, isAdmin, publishUnpublishCourse);
router.patch("/:id", formidable(), checkToken, isAdmin, updateCourse);
router.delete("/:id", checkToken, isAdmin, deleteCourse);

module.exports = router;
