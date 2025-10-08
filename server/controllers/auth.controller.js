const pool = require("../config/new_db.js");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
console.log("JWT", JWT_SECRET);

const userLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const query =
      "SELECT id, email, password, office FROM users WHERE email = $1";
    const result = await pool.query(query, [email]);
    const user = result.rows[0];

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Incorrect password" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: "user", officeId: user.office },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(200).json({ success: true, token });
  } catch (error) {
    console.error("Error in userLogin:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const adminLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const query =
      "SELECT id, email, password, office FROM admin WHERE email = $1";
    const result = await pool.query(query, [email]);
    const admin = result.rows[0];

    if (!admin) {
      return res
        .status(404)
        .json({ success: false, message: "Admin not found" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Incorrect password" });
    }

    const token = jwt.sign(
      {
        id: admin.id,
        email: admin.email,
        role: "admin",
        officeId: admin.office,
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({ success: true, token });
  } catch (error) {
    console.error("Error in adminLogin:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { userLogin, adminLogin };
