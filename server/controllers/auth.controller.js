const supabase = require("../config/db.js");
const express = require("express");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

const userLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, email, password")
      .eq("email", email)
      .single();

    if (error || !data) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (data.password !== password) {
      return res
        .status(401)
        .json({ success: false, message: "Incorrect password" });
    }

    const token = jwt.sign(
      {
        id: data.id,
        email: data.email,
        role: "user", // 👈 Mark this as user
      },
      JWT_SECRET,
      { expiresIn: "9h" }
    );

    return res.status(200).json({ success: true, token });
  } catch (error) {
    console.error("Error in userLogin:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const adminLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const { data, error } = await supabase
      .from("admin")
      .select("id, email, password")
      .eq("email", email)
      .single();

    if (error || !data) {
      return res
        .status(404)
        .json({ success: false, message: "Admin not found" });
    }

    if (data.password !== password) {
      return res
        .status(401)
        .json({ success: false, message: "Incorrect password" });
    }

    const token = jwt.sign(
      {
        id: data.id,
        email: data.email,
        role: "admin", // 👈 Mark this as admin
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.status(200).json({ success: true, token });
  } catch (error) {
    console.error("Error in userLogin:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { userLogin, adminLogin };
