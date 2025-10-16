import React from "react";
import "../meeting/requestmeetingform.css" // Optional: include styling
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
  const [office, setOffice] = useState("");
  const [phone, setPhone] = useState("");
  const [formError, setFormError] = useState(null);

  const handleSubmit = async (e) => {
    const token = localStorage.getItem("token");

    e.preventDefault();

    if (!name || !email || !password || !office || !phone) {
      setFormError("Please fill in all fields correctly");
      console.log("fill all details");
    }

    const response = await axios.post(
      "http://localhost:3000/manageUser/addUser",
      {
        name,
        email,
        password,
        office,
        phone,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (response.error) {
      setFormError(response.error);
      console.log(formError);
    }
    if (response.data.success) {
      setFormError(null);
      console.log(response.data);
    }
    alert("Form Submitted successfully");
    onClose(true);
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
            <label>Office</label>
            <input
              type="text"
              placeholder="e.g. New York"
              value={office}
              onChange={(e) => setOffice(e.target.value)}
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
