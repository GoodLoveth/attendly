const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
    createAttendance
} = require("../controllers/createAttendance");

const {
    getAttendance
} = require("../controllers/getAttendance");

const {
    getAttendanceByStudentId
} = require("../controllers/getStudentAttendance");

const {
    updateAttendance
} = require("../controllers/updateAttendance");

const {
    deleteAttendance
} = require("../controllers/deleteAttendance");


router.post(
    "/",
    protect,
    createAttendance
);

router.get(
    "/",
    protect,
    getAttendance
);

router.get(
    "/student",
    protect,
    getAttendanceByStudentId
);

router.put(
    "/:id",
    protect,
    updateAttendance
);

router.delete(
    "/:id",
    protect,
    deleteAttendance
);


module.exports = router;