const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
    createStudent
} = require("../controllers/createStudent");

const {
    getStudents
} = require("../controllers/getstudents");

const {
    getStudentByStudentId
} = require("../controllers/getStudentById");

const {
    updateStudent
} = require("../controllers/updateStudent");

const {
    deleteStudent
} = require("../controllers/deleteStudent");


router.post(
    "/",
    protect,
    createStudent
);

router.get(
    "/",
    protect,
    getStudents
);

router.get(
    "/:studentId",
    protect,
    getStudentByStudentId
);

router.put(
    "/:studentId",
    protect,
    updateStudent
);

router.delete(
    "/:studentId",
    protect,
    deleteStudent
);


module.exports = router;