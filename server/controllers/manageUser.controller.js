const pool = require("../config/new_db.js");
const bcrypt = require("bcrypt");

// Helper functions for validation
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const isValidPhone = (phone) => /^\d{10}$/.test(phone);

const isValidPassword = (password) =>
  typeof password === "string" && password.length >= 8;

const isValidName = (name) =>
  typeof name === "string" && name.trim().length > 0;

// Get all users of an office
const getAllUsersOfOffice = async (req, res) => {
  const officeId = req.user.officeId;

  try {
    const result = await pool.query(
      "SELECT id, name, email, phone FROM users WHERE office = $1",
      [officeId]
    );

    return res.status(200).json({ data: result.rows });
  } catch (err) {
    console.error("User fetching error: ", err);
    return res
      .status(500)
      .json({ success: false, message: "ERROR in User fetching" });
  }
};

// Add a user with validation and password hashing
const addUser = async (req, res) => {
  const officeId = req.user.officeId;
  const { name, email, password, phone } = req.body;

  // ✅ Validation
  if (!isValidName(name)) {
    return res.status(400).json({ success: false, message: "Invalid name" });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ success: false, message: "Invalid email" });
  }
  if (!isValidPassword(password)) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 8 characters",
    });
  }
  if (!isValidPhone(phone)) {
    return res.status(400).json({
      success: false,
      message: "Phone must be exactly 10 digits",
    });
  }

  try {
    // ✅ Check if email already exists
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [
      email,
    ]);
    if (existing.rows.length > 0) {
      return res
        .status(400)
        .json({ success: false, message: "Email already exists" });
    }

    // ✅ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Insert user
    const result = await pool.query(
      "INSERT INTO users (name, email, password, office, phone) VALUES ($1, $2, $3, $4, $5) RETURNING id",
      [name, email, hashedPassword, officeId, phone]
    );

    return res.status(200).json({
      success: true,
      message: "USER added successfully.",
      id: result.rows[0].id,
    });
  } catch (err) {
    console.error("ERROR in user add", err);
    return res
      .status(500)
      .json({ success: false, message: "ERROR in adding user" });
  }
};

// Delete a user
const deleteUser = async (req, res) => {
  const id = req.body.id;

  try {
    const result = await pool.query(
      "DELETE FROM users WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    return res
      .status(200)
      .json({ success: true, message: "User Deleted successfully" });
  } catch (error) {
    console.error("ERROR in deleting user: ", error);
    return res
      .status(500)
      .json({ success: false, message: "ERROR in deleting user exception" });
  }
};

module.exports = { getAllUsersOfOffice, addUser, deleteUser };
