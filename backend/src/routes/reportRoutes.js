const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
    getStudentReport
} = require("../controllers/getStudentReport");

const {
    getAttendanceReport
} = require("../controllers/getAttendanceReport");


router.get(
    "/student/:studentId",
    protect,
    getStudentReport
);

router.get(
    "/attendance",
    protect,
    getAttendanceReport
);


module.exports = router;