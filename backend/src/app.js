const express = require("express");
const cors = require("cors");

const studentRoutes = require("./routes/studentRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const reportRoutes = require("./routes/reportRoutes");
const authRoutes = require("./routes/authRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

const errorMiddleware = require("./middleware/errorMiddleware");

const app = express();

// MIDDLEWARE

app.use(
    cors({
        origin: true,
        credentials: true
    })
);

app.use(express.json());

// ROUTES

app.use("/api/auth", authRoutes);

app.use("/api/students", studentRoutes);

app.use("/api/attendance", attendanceRoutes);

app.use("/api/reports", reportRoutes);

app.use("/api/dashboard", dashboardRoutes);

// API TEST ROUTE

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Attendly API is running",
        data: null
    });
});

// ERROR HANDLER

app.use(errorMiddleware);

module.exports = app;