const Attendance = require("../models/Attendance");
const Student = require("../models/Student");

const deleteAttendance = async (req, res, next) => {
    try {
        const attendance =
            await Attendance.findById(req.params.id);

        if (!attendance) {
            return res.status(404).json({
                success: false,
                message: "Attendance record not found",
                data: null
            });
        }

        const student = await Student.findOne({
            studentId: attendance.studentId,
            lecturerId: req.user.userId
        });

        if (!student) {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to delete this attendance record",
                data: null
            });
        }

        await Attendance.findByIdAndDelete(
            req.params.id
        );

        res.status(200).json({
            success: true,
            message: "Attendance deleted successfully",
            data: null
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    deleteAttendance
};