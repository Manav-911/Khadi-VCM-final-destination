const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "no Token provided" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ messgae: "Invalid Token" });
    }

    console.log(user.id);

    req.user = {
      userId: user.id,
      officeId: user.officeId,
      role: user.role,
    };
    next();
  });
};

const isAdmin = async (req, res, next) => {
  if (req.user?.role != "admin") {
    console.log("Admin access only");
    return res.status(401).json({ message: "Admin access only" });
  }
  next();
};

const isUser = async (req, res, next) => {
  if (req.user?.role != "user") {
    return res.status(401).json({ message: "User Access only" });
  }
  next();
};

module.exports = { authenticateToken, isAdmin, isUser };
