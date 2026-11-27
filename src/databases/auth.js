const { createHash } = require("node:crypto");

// Store only token hashes, not raw refresh tokens
const activeRefreshTokens = new Map();

// Generate a SHA-256 hash of a refresh token
function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

// Save a refresh token record after successful login
function saveRefreshToken(token, userId, expiresAt) {
  const tokenHash = hashToken(token);

  activeRefreshTokens.set(tokenHash, {
    userId,
    expiresAt,
  });
}

// Find a refresh token record
function getRefreshToken(token) {
  const tokenHash = hashToken(token);

  const record = activeRefreshTokens.get(tokenHash);

  if (!record) {
    return null;
  }

  // Reject and remove expired records
  if (Date.now() >= record.expiresAt) {
    activeRefreshTokens.delete(tokenHash);
    return null;
  }

  return record;
}

// Remove a refresh token during logout
function deleteRefreshToken(token) {
  const tokenHash = hashToken(token);

  return activeRefreshTokens.delete(tokenHash);
}

module.exports = {
  saveRefreshToken,
  getRefreshToken,
  deleteRefreshToken,
};
