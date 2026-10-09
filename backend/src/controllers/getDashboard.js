const Student = require("../models/Student");
const Attendance = require("../models/Attendance");

const getDashboard = async (req, res, next) => {
    try {
        const lecturerId = req.user.userId;
        
        // GET ALL STUDENTS BELONGING TO THIS LECTURER

        const students = await Student.find({
            lecturerId
        }).select("name studentId");

        const totalStudents = students.length;

        const studentIds = students.map(
            student => student.studentId
        );

        // CREATE STUDENT LOOKUP

        const studentMap = new Map();

        students.forEach(student => {
            studentMap.set(
                student.studentId,
                {
                    _id: student._id,
                    name: student.name,
                    studentId: student.studentId
                }
            );
        });

        // TODAY'S DATE

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        // TODAY'S ATTENDANCE

        const todayAttendance = await Attendance.find({
            studentId: {
                $in: studentIds
            },
            date: {
                $gte: startOfDay,
                $lte: endOfDay
            }
        }).sort({
            date: -1
        }).lean();

        const totalPresent = todayAttendance.filter(
            record => record.status === "Present"
        ).length;

        const totalAbsent = todayAttendance.filter(
            record => record.status === "Absent"
        ).length;

        const totalMarked =
            totalPresent + totalAbsent;

        const attendanceRate =
            totalMarked === 0
                ? 0
                : Number(
                    (
                        (totalPresent / totalMarked) *
                        100
                    ).toFixed(1)
                );

        // RECENT ATTENDANCE

        const recentRecords = await Attendance.find({
            studentId: {
                $in: studentIds
            }
        })
            .sort({
                date: -1,
                createdAt: -1
            })
            .limit(10)
            .lean();

        // Attach student information manually because
        // Attendance.studentId is a String.
        const recentAttendance = recentRecords.map(
            record => ({
                ...record,

                studentId:
                    studentMap.get(record.studentId) || {
                        name: "Unknown Student",
                        studentId: record.studentId
                    }
            })
        );

        // RESPONSE

        res.status(200).json({
            success: true,
            message: "Dashboard data retrieved successfully",

            data: {
                totalStudents,
                totalPresent,
                totalAbsent,
                attendanceRate,
                recentAttendance
            }
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    getDashboard
};