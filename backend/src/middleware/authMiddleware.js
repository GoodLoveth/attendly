
const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "Authentication required. Please provide a valid token.",
            data: null
        });
    }

    const token = authHeader.slice(7).trim();

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Authentication required. Please provide a valid token.",
            data: null
        });
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
        console.error("JWT_SECRET is not configured.");
        return res.status(500).json({
            success: false,
            message: "Server authentication is not configured.",
            data: null
        });
    }

    if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is not configured.");

    return res.status(500).json({
        success: false,
        message: "Server authentication is not configured.",
        data: null
    });
}

    try {
        const decoded = jwt.verify(token, secret);

        if (!decoded.userId) {
            return res.status(401).json({
                success: false,
                message: "Invalid authentication token.",
                data: null
            });
        }

        req.user = decoded;
        return next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token",
            data: null
        });
    }
};

module.exports = protect;