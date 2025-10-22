import React from "react";
import "../meeting/requestmeetingform.css"; // Optional: include styling
import { useState } from "react";
// import supabase from "../../config/supabaseClient";
import axios from "axios";
import "./addUser.css";
import "../../App.css";

function AddUser({ open, onClose }) {
  if (!open) return null; // Don't render anything if not open

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [formError, setFormError] = useState(null);

  const handleSubmit = async (e) => {
  e.preventDefault();

  const token = localStorage.getItem("token");

  // ✅ Input validation
  if (!name || !email || !password || !phone) {
    setFormError("Please fill in all fields correctly");
    alert("⚠️ Please fill in all fields before submitting");
    return;
  }

  try {
    const response = await axios.post(
      "http://localhost:3000/manageUser/addUser",
      { name, email, password, phone },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    // ✅ Handle success
    if (response.data?.success) {
      setFormError(null);
      alert("✅ User added successfully!");
      onClose(true);
    } else {
      const message = response.data?.message || "Something went wrong.";
      setFormError(message);
      alert(`❌ Failed to add user: ${message}`);
    }
  } catch (error) {
    // ✅ Catch & handle all Axios errors
    console.error("Error adding user:", error);

    if (error.response) {
      // Server responded with error status (400, 401, etc.)
      const msg =
        error.response.data?.message ||
        `Server responded with status ${error.response.status}`;
      alert(`❌ Request failed: ${msg}`);
    } else if (error.request) {
      // Request was made but no response received
      alert("⚠️ No response from server. Please check your connection.");
    } else {
      // Something else went wrong
      alert("❌ Error: " + error.message);
    }

    setFormError("Failed to add user. Please check console for details.");
  }
};

  return (
    <div className="meeting-form-container popup">
      <div className="form-wrapper">
        <div className="form-header">
          <h2 className="form-title">Add User</h2>
          <button type="button" className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        <form className="request-form">
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="e.g. abc@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Phone</label>
            <input
              type="tel"
              placeholder="e.g. (123) 456-7890"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <button type="submit" onClick={handleSubmit}>
            Add
          </button>
          <button className="close-form-btn" onClick={onClose}>
            Close
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddUser;
