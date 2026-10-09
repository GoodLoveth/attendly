const Attendance = require("../models/Attendance");
const Student = require("../models/Student");

const getStudentReport = async (
    req,
    res,
    next
) => {
    try {
        const {
            studentId
        } = req.params;

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

        const totalAttendance =
            attendance.length;

        const presentCount =
            attendance.filter(
                record =>
                    record.status === "Present"
            ).length;

        const absentCount =
            attendance.filter(
                record =>
                    record.status === "Absent"
            ).length;

        const attendanceRate =
            totalAttendance === 0
                ? 0
                : Math.round(
                    (presentCount /
                        totalAttendance) *
                        100
                );

        res.status(200).json({
            success: true,
            message:
                "Student attendance report fetched successfully",

            data: {
                student,
                attendance,

                statistics: {
                    totalAttendance,
                    presentCount,
                    absentCount,
                    attendanceRate
                }
            }
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    getStudentReport
};