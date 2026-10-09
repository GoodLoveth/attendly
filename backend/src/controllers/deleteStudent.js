const Student = require("../models/Student");

const deleteStudent = async (req, res, next) => {
    try {
        const student = await Student.findOneAndDelete({
            studentId: req.params.studentId,
            lecturerId: req.user.userId
        });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found",
                data: null
            });
        }

        res.status(200).json({
            success: true,
            message: "Student deleted successfully",
            data: student
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    deleteStudent
};