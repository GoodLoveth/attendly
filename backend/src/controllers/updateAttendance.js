const Attendance = require("../models/Attendance");
const Student = require("../models/Student");

const updateAttendance = async (req, res, next) => {
    try {
        const existingAttendance =
            await Attendance.findById(req.params.id);

        if (!existingAttendance) {
            return res.status(404).json({
                success: false,
                message: "Attendance record not found",
                data: null
            });
        }

        // To Make sure the attendance belongs to
        // a student owned by this lecturer.
        const student = await Student.findOne({
            studentId: existingAttendance.studentId,
            lecturerId: req.user.userId
        });

        if (!student) {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to update this attendance record",
                data: null
            });
        }

        const updateData = {};

        if (req.body.date) {
            const newDate = new Date(req.body.date);

            if (Number.isNaN(newDate.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid attendance date",
                    data: null
                });
            }

            newDate.setHours(0, 0, 0, 0);

            updateData.date = newDate;
        }

        if (req.body.status) {
            if (
                !["Present", "Absent"]
                    .includes(req.body.status)
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Status must be Present or Absent",
                    data: null
                });
            }

            updateData.status = req.body.status;
        }

        const attendance =
            await Attendance.findByIdAndUpdate(
                req.params.id,
                updateData,
                {
                    new: true,
                    runValidators: true
                }
            );

        res.status(200).json({
            success: true,
            message: "Attendance updated successfully",
            data: attendance
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    updateAttendance
};