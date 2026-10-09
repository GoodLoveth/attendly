const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
    {
        studentId: {
            type: String,
            required: true,
            trim: true
        },

        date: {
            type: Date,
            required: true
        },

        status: {
            type: String,
            enum: ["Present", "Absent"],
            required: true
        }
    },
    {
        timestamps: true
    }
);

attendanceSchema.index(
    {
        studentId: 1,
        date: 1
    },
    {
        unique: true
    }
);

module.exports =
    mongoose.models.Attendance ||
    mongoose.model("Attendance", attendanceSchema);