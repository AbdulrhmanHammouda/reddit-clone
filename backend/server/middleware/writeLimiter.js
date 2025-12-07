const rateLimit = require("express-rate-limit");

// 📝 Protect write operations (POST / PUT / DELETE)
// Prevents spam (comments, votes, posts, messages)
const writeLimiter = rateLimit({
  windowMs: 60 * 1000,        // 1 minute window
  max: 30,                    // Max 30 write requests per minute per IP
  message: {
    error: "Too many actions, slow down."
  },
  standardHeaders: true,      // Include RateLimit-* headers
  legacyHeaders: false,       // Disable X-RateLimit-* headers
});

module.exports = { writeLimiter };
