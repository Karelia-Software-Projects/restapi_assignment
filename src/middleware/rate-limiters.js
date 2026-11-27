const { rateLimit } = require("express-rate-limit");

// 15 minutes in milliseconds
const WINDOW_MS = 15 * 60 * 1000;

// General Todo API rate limiter
const apiLimiter = rateLimit({
  windowMs: WINDOW_MS,
  limit: 100,

  standardHeaders: "draft-8",
  legacyHeaders: false,

  message: {
    error: "Too many API requests. Please try again later.",
  },
});

// Login rate limiter
const loginLimiter = rateLimit({
  windowMs: WINDOW_MS,
  limit: 5,

  standardHeaders: "draft-8",
  legacyHeaders: false,

  message: {
    error: "Too many login attempts. Please try again later.",
  },
});

module.exports = {
  apiLimiter,
  loginLimiter,
};
