const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev_secret");

    const user = await User.findById(decoded.id).select("username email avatar");
    if (!user) return res.status(401).json({ error: "Invalid token" });

    req.user = {
      id: decoded.id,
      _id: decoded.id // 👈 required for createdBy matching
    };

    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};
