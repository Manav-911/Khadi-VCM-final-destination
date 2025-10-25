import React from "react";
import "../meeting/requestmeetingform.css"; // Optional: include styling
import { useState } from "react";
// import supabase from "../../config/supabaseClient";
import axios from "axios";
import "./addUser.css";
import "../../App.css";

function AddUser({ open, onClose, onUserAdd }) {
  if (!open) return null; // Don't render anything if not open

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [formError, setFormError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    setIsLoading(true);
    setFormError(null);
    const token = localStorage.getItem("token");

    e.preventDefault();

    if (!name || !email || !password || !phone) {
      setFormError("Please fill in all fields correctly");
      console.log("fill all details");
      setIsLoading(false);
      return;
    }
    try {
      const response = await axios.post(
        "http://localhost:3000/manageUser/addUser",
        {
          name,
          email,
          password,
          phone,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.data.success) {
        setFormError(null);
        console.log(response.data);
        alert("user Added successfully");
        setName("");
        setEmail("");
        setPassword("");
        setPhone("");
        if (onUserAdd) {
          onUserAdd();
        }
        onClose();
      } else {
        setFormError(response.data.message || "Failed to add user");
      }
    } catch (error) {
      console.error("Error adding user:", error);
      setFormError(error.response?.data?.message || "Error adding user");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    // Reset form when closing
    setName("");
    setEmail("");
    setPassword("");
    setPhone("");
    setFormError(null);
    onClose();
  };

  return (
    <div className="meeting-form-container popup">
      <div className="form-wrapper">
        <div className="form-header">
          <h2 className="form-title">Add User</h2>
          <button type="button" className="close-btn" onClick={handleClose}>
            ×
          </button>
        </div>

        {formError && (
          <div
            className="error-message"
            style={{ color: "red", marginBottom: "10px" }}
          >
            {formError}
          </div>
        )}

        <form className="request-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isLoading}
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
              disabled={isLoading}
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
              disabled={isLoading}
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
              disabled={isLoading}
            />
          </div>

          <button type="submit" disabled={isLoading}>
            {isLoading ? "Adding..." : "Add User"}
          </button>
          <button
            type="button"
            className="close-form-btn"
            onClick={handleClose}
            disabled={isLoading}
          >
            Close
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddUser;
