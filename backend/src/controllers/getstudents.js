const Student = require("../models/Student");

const getStudents = async (req, res, next) => {
    try {
        const students = await Student.find({
            lecturerId: req.user.userId
        }).sort({
            name: 1
        });

        res.status(200).json({
            success: true,
            message: "Students fetched successfully",
            data: students
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    getStudents
};