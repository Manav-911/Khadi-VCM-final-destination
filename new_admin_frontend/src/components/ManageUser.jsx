// ScheduleMeeting.jsx
import React, { useState } from "react";
import "../styles/ScheduleMeeting.css";
import "../App.jsx";

function ManageUser({ open, onClose }) {
  if (!open) return null;
  return (
    <div className="overlay">
      <div className="popup">
        <button onClick={onClose}>X</button>
        <h2>Manage users</h2>
        <div className="right-panel">
          <button className="btn active">+</button>
        </div>
        <div>Meeting List</div>
        <button type="button" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

export default ManageUser;
