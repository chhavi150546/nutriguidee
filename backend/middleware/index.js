
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "nutriguide_jwt_secret_change_me";

function requestLogger(req, res, next) {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
}


function verifyJWT(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader?.startsWith("Bearer ")) {
    const err = new Error("No token provided");
    err.status = 401;
    return next(err);
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;    +
    next();
  } catch (err) {
    err.status = 401;
    err.message = "Invalid or expired token";
    next(err);
  }
}

function verifySession(req, res, next) {
  if (req.session?.userId) return next();
  res.redirect("/admin/login");
}

function apiKeyGuard(req, res, next) {
  const key = req.headers["x-api-key"];
  if (key && key === process.env.INTERNAL_API_KEY) return next();
  next();
}



module.exports = { requestLogger, verifyJWT, verifySession, apiKeyGuard };
