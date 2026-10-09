const Attendance = require("../models/Attendance");
const Student = require("../models/Student");

const getAttendanceReport = async (
    req,
    res,
    next
) => {
    try {
        const {
            date
        } = req.query;

        const students = await Student.find({
            lecturerId: req.user.userId
        }).select("studentId");

        const studentIds = students.map(
            student => student.studentId
        );

        const filter = {
            studentId: {
                $in: studentIds
            }
        };

        if (date) {
            const selectedDate = new Date(date);

            selectedDate.setHours(0, 0, 0, 0);

            const nextDate = new Date(
                selectedDate
            );

            nextDate.setDate(
                nextDate.getDate() + 1
            );

            filter.date = {
                $gte: selectedDate,
                $lt: nextDate
            };
        }

        const attendance =
            await Attendance.find(filter)
                .sort({
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
                "Attendance report fetched successfully",

            data: {
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
    getAttendanceReport
};