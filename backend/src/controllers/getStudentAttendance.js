const Attendance = require("../models/Attendance");
const Student = require("../models/Student");

const getAttendanceByStudentId = async (
    req,
    res,
    next
) => {
    try {
        const {
            studentId
        } = req.query;

        if (!studentId) {
            return res.status(400).json({
                success: false,
                message: "studentId is required",
                data: null
            });
        }

        const student = await Student.findOne({
            studentId,
            lecturerId: req.user.userId
        });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found",
                data: null
            });
        }

        const attendance = await Attendance.find({
            studentId
        }).sort({
            date: -1
        });

        res.status(200).json({
            success: true,
            message: "Attendance retrieved successfully",
            data: attendance
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAttendanceByStudentId
};