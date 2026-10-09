const Student = require("../models/Student");

const createStudent = async (req, res, next) => {
    try {
        const {
            name,
            studentId,
            email,
            department,
            level
        } = req.body;

        if (
            !name ||
            !studentId ||
            !email ||
            !department ||
            !level
        ) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
                data: null
            });
        }

        const student = await Student.create({
            name: name.trim(),
            studentId: studentId.trim(),
            email: email.toLowerCase().trim(),
            department: department.trim(),
            level: level.trim(),
            lecturerId: req.user.userId
        });

        res.status(201).json({
            success: true,
            message: "Student created successfully",
            data: student
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    createStudent
};