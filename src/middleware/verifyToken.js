const authService = require("../services/auth");

function verifyToken(req, res, next) {
  // Read the Authorization header
  const authHeader = req.get("Authorization");

  // Check whether the header exists
  if (!authHeader) {
    return res.status(401).json({
      error: "Access token missing",
    });
  }

  // Expected format: Bearer <token>
  const parts = authHeader.trim().split(/\s+/);

  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer" || !parts[1]) {
    return res.status(401).json({
      error: "Invalid authorization format",
    });
  }

  const token = parts[1];

  // Verify the JWT using the authentication service
  const decoded = authService.verifyAccessToken(token);

  if (!decoded) {
    return res.status(401).json({
      error: "Invalid or expired access token",
    });
  }

  // Make authenticated user information available
  req.user = {
    id: decoded.sub,
  };

  // Continue to the requested Todo endpoint
  next();
}

module.exports = verifyToken;
