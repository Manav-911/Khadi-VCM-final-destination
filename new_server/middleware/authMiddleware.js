const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

const authenticateToken = async (req, res, next) => {
  // ✅ Get the Authorization header (e.g., "Bearer eyJhbGciOi...")
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Take token part only

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid token" });
    }
    req.user = user; // attach decoded user info to request
    next();
  });
};

const isAdmin = async (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(401).json({ message: "Admin access only" });
  }
  next();
};

const isUser = async (req, res, next) => {
  if (req.user?.role !== "user") {
    return res.status(401).json({ message: "User access only" });
  }
  next();
};

module.exports = { authenticateToken, isAdmin, isUser };
