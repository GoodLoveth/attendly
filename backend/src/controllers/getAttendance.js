
const Attendance = require("../models/Attendance");
const Student = require("../models/Student");

const getAttendance = async (req, res, next) => {
    try {
        const students = await Student.find({
            lecturerId: req.user.userId
        }).lean();

        // Map each student ID to the student's name.
        const studentMap = new Map(
            students.map(student => {
                const name =
                    student.name ||
                    student.fullName ||
                    student.studentName ||
                    [student.firstName, student.lastName]
                        .filter(Boolean)
                        .join(" ");

                return [
                    String(student.studentId).trim(),
                    name || "Unknown Student"
                ];
            })
        );

        const studentIds = students.map(
            student => student.studentId
        );

        const attendance = await Attendance.find({
            studentId: { $in: studentIds }
        })
            .sort({ date: -1 })
            .lean();

        const attendanceWithNames = attendance.map(record => ({
            ...record,
            studentName:
                studentMap.get(String(record.studentId).trim()) ||
                "Unknown Student"
        }));

        res.status(200).json({
            success: true,
            message: "Attendance fetched successfully",
            data: attendanceWithNames
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAttendance
};