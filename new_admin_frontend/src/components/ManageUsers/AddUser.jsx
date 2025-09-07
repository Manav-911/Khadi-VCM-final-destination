import React from "react";
import "../../styles/ScheduleMeeting.css"; // Optional: include styling
import { useState } from "react";
import supabase from "../../config/supabaseClient";
import axios from "axios";

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
    <div className="overlay">
      <div className="popup">
        <h2>Add New User</h2>
        <form>
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {/* <input type="text" placeholder="Office" value={office} onChange={(e=>setOffice(e.target.value))} required/> */}
          <input
            type="tel"
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <button type="submit" onClick={handleSubmit}>
            Add
          </button>
          <button type="close-btn" onClick={onClose}>
            Close
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddUser;
