// ScheduleMeeting.jsx
import React, {useState} from 'react';
import '../styles/ScheduleMeeting.css';

function ScheduleMeeting({open ,onClose}) {
    if(!open) return null;
  return (
        <div className="overlay">
        <div className="popup">
            <button onClick={onClose}>X</button>
            <h2>Schedule a Meeting</h2>
            <form>
                <input type="text" name="title" placeholder="Meeting Title" required />
                <input type="date" name="date" required />
                <input type="time" name="time" required />
                <input type="number" name="duration" placeholder="Duration in minutes" required />
                <input type="text" name="participants" placeholder="Participants (comma separated)" required />
                <textarea name="description" placeholder="Meeting Description" />
                <br />
            <button type="submit">Submit</button>
            <button type="button" onClick={onClose}>Close</button>
            </form>
        </div>
    </div>
    
  );
}

export default ScheduleMeeting;
