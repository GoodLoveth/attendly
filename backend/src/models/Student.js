const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        studentId: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        department: {
            type: String,
            required: true,
            trim: true
        },

        level: {
            type: String,
            required: true,
            trim: true
        },

        lecturerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    {
        timestamps: true
    }
);

// A lecturer cannot have two students with the same student ID.
studentSchema.index(
    {
        lecturerId: 1,
        studentId: 1
    },
    {
        unique: true
    }
);

module.exports =
    mongoose.models.Student ||
    mongoose.model("Student", studentSchema);