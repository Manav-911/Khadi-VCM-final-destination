const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

const authenticateToken = async (req, res, next) => {
  const token = req.cookies.token; // ✅ now reads from cookie

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid token" }); // 🛠️ fixed typo "messgae"
    }
    req.user = user;
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
