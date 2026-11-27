const express = require("express");
const authService = require("../services/auth");

const router = express.Router();

// Cookie settings shared by login and logout
const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/",
};

// POST /login - Authenticate user
router.post("/login", (req, res) => {
  const { username, password } = req.body || {};

  const tokens = authService.login(username, password);

  if (!tokens) {
    return res.status(401).json({
      error: "Invalid username or password",
    });
  }

  // Save refresh token in an HTTP-only cookie
  res.cookie("refreshToken", tokens.refreshToken, {
    ...refreshCookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  // Return only the access token in JSON
  return res.status(200).json({
    accessToken: tokens.accessToken,
    tokenType: "Bearer",
    expiresIn: 900,
  });
});

// POST /refresh - Generate a new access token
router.post("/refresh", (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({
      error: "Refresh token missing",
    });
  }

  const accessToken = authService.refreshAccessToken(refreshToken);

  if (!accessToken) {
    return res.status(401).json({
      error: "Invalid or expired refresh token",
    });
  }

  return res.status(200).json({
    accessToken,
    tokenType: "Bearer",
    expiresIn: 900,
  });
});

// POST /logout - Invalidate the refresh token
router.post("/logout", (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (refreshToken) {
    authService.logout(refreshToken);
  }

  // Remove refresh token from the browser
  res.clearCookie("refreshToken", refreshCookieOptions);

  return res.status(204).send();
});

module.exports = router;
