const errorMiddleware = (
    error,
    req,
    res,
    next
) => {
    console.error(error);

    if (error.name === "ValidationError") {
        return res.status(400).json({
            success: false,
            message: error.message,
            data: null
        });
    }

    if (error.code === 11000) {
        return res.status(409).json({
            success: false,
            message:
                "Student ID, email, or attendance record already exists",
            data: null
        });
    }

    res.status(500).json({
        success: false,
        message: "Something went wrong",
        data: null
    });
};

module.exports = errorMiddleware;