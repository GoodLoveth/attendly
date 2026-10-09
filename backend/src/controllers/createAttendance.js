const Attendance = require("../models/Attendance");
const Student = require("../models/Student");

const createAttendance = async (req, res, next) => {
    try {
        const {
            studentId,
            date,
            status
        } = req.body;

        if (!studentId || !date || !status) {
            return res.status(400).json({
                success: false,
                message: "studentId, date and status are required",
                data: null
            });
        }

        if (!["Present", "Absent"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Status must be Present or Absent",
                data: null
            });
        }

        // Make sure the student belongs to this lecturer.
        const student = await Student.findOne({
            studentId: studentId.trim(),
            lecturerId: req.user.userId
        });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found",
                data: null
            });
        }

        // Normalize the date to the beginning of the day.
        const attendanceDate = new Date(date);
        attendanceDate.setHours(0, 0, 0, 0);

        // Prevent duplicate attendance for the same student/day.
        const existingAttendance = await Attendance.findOne({
            studentId: student.studentId,
            date: attendanceDate
        });

        if (existingAttendance) {
            return res.status(409).json({
                success: false,
                message: "Attendance has already been recorded for this student on this date",
                data: existingAttendance
            });
        }

        const attendance = await Attendance.create({
            studentId: student.studentId,
            date: attendanceDate,
            status
        });

        res.status(201).json({
            success: true,
            message: "Attendance recorded successfully",
            data: attendance
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    createAttendance
};