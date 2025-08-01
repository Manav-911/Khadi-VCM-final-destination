import React from 'react';
import '../../styles/ScheduleMeeting.css'; // Optional: include styling

function AddUser({ open, onClose }) {
  if (!open) return null; // Don't render anything if not open

  return (
    <div className="overlay">
      <div className="popup">
        <h2>Add New User</h2>
        <form>
          <input type="text" placeholder="Name" required/>
          <input type="email" placeholder="Email" required />
          <input type="password" placeholder="Password" required />
          <input type="text" placeholder="Office"  required/>
          <input type="tel" placeholder="Phone"  required/>
          <button type="submit">Add</button>
          <button type='close-btn' onClick={onClose}>Close</button>
        </form>
      </div>
    </div>
  );
}

export default AddUser;
