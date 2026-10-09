
const express = require("express");
const cors = require("cors");

const app = express();

// CORS configuration
app.use(
    cors({
        origin: "https://attendly-frontend-chi.vercel.app",
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"]
    })
);

// Middleware
app.use(express.json());

// Routes
const studentRoutes = require("./routes/studentRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const reportRoutes = require("./routes/reportRoutes");
const authRoutes = require("./routes/authRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

const errorMiddleware = require("./middleware/errorMiddleware");

// API endpoints
app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Health check
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Attendly API is running",
        data: null
    });
});

// Error handler
app.use(errorMiddleware);

module.exports = app;