const jwt = require("jsonwebtoken");

const { randomUUID, createHash, timingSafeEqual } = require("node:crypto");

const authDB = require("../databases/auth");

// Read authentication settings
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

const ACCESS_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || "15m";
const REFRESH_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || "7d";

const AUTH_USERNAME = process.env.AUTH_USERNAME;
const AUTH_PASSWORD = process.env.AUTH_PASSWORD;

// Check required configuration
if (!ACCESS_SECRET || !REFRESH_SECRET || !AUTH_USERNAME || !AUTH_PASSWORD) {
  throw new Error("Missing authentication environment variables");
}

// Compare passwords without ordinary string equality
function passwordsMatch(provided, expected) {
  if (typeof provided !== "string") {
    return false;
  }

  const providedHash = createHash("sha256").update(provided).digest();

  const expectedHash = createHash("sha256").update(expected).digest();

  return timingSafeEqual(providedHash, expectedHash);
}

// Generate an access token
function createAccessToken(userId) {
  return jwt.sign({ type: "access" }, ACCESS_SECRET, {
    algorithm: "HS256",
    subject: userId,
    expiresIn: ACCESS_EXPIRY,
  });
}

// Generate a refresh token with a unique ID
function createRefreshToken(userId) {
  return jwt.sign({ type: "refresh" }, REFRESH_SECRET, {
    algorithm: "HS256",
    subject: userId,
    jwtid: randomUUID(),
    expiresIn: REFRESH_EXPIRY,
  });
}

// Verify access token
function verifyAccessToken(token) {
  try {
    const decoded = jwt.verify(token, ACCESS_SECRET, { algorithms: ["HS256"] });

    if (decoded.type !== "access") {
      return null;
    }

    return decoded;
  } catch (error) {
    return null;
  }
}

// Verify refresh JWT and its stored record
function verifyRefreshToken(token) {
  try {
    const decoded = jwt.verify(token, REFRESH_SECRET, {
      algorithms: ["HS256"],
    });

    if (decoded.type !== "refresh") {
      return null;
    }

    const storedToken = authDB.getRefreshToken(token);

    if (!storedToken || storedToken.userId !== decoded.sub) {
      return null;
    }

    return decoded;
  } catch (error) {
    return null;
  }
}

// Authenticate the user and create both tokens
function login(username, password) {
  if (username !== AUTH_USERNAME || !passwordsMatch(password, AUTH_PASSWORD)) {
    return null;
  }

  const accessToken = createAccessToken(username);
  const refreshToken = createRefreshToken(username);

  // Read expiry from the signed refresh JWT
  const decoded = jwt.verify(refreshToken, REFRESH_SECRET, {
    algorithms: ["HS256"],
  });

  const expiresAt = decoded.exp * 1000;

  // Store refresh token record
  authDB.saveRefreshToken(refreshToken, username, expiresAt);

  return {
    accessToken,
    refreshToken,
  };
}

// Issue a new access token using a refresh token
function refreshAccessToken(refreshToken) {
  const decoded = verifyRefreshToken(refreshToken);

  if (!decoded) {
    return null;
  }

  return createAccessToken(decoded.sub);
}

// Invalidate the refresh token during logout
function logout(refreshToken) {
  if (!refreshToken) {
    return false;
  }

  return authDB.deleteRefreshToken(refreshToken);
}

module.exports = {
  login,
  createAccessToken,
  createRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  refreshAccessToken,
  logout,
};
