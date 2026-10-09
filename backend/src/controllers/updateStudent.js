const Student = require("../models/Student");

const updateStudent = async (req, res, next) => {
    try {
        const {
            name,
            studentId,
            email,
            department,
            level
        } = req.body;

        const updatedStudent = await Student.findOneAndUpdate(
            {
                studentId: req.params.studentId,
                lecturerId: req.user.userId
            },
            {
                name,
                studentId,
                email,
                department,
                level
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!updatedStudent) {
            return res.status(404).json({
                success: false,
                message: "Student not found",
                data: null
            });
        }

        res.status(200).json({
            success: true,
            message: "Student updated successfully",
            data: updatedStudent
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    updateStudent
};