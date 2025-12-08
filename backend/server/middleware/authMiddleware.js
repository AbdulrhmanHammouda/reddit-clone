// backend/middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async function (req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      error: "Not authorized - No token",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("_id username avatar")
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "User no longer exists",
      });
    }

    req.user = user; 
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: "Invalid or expired token",
    });
  }
};
