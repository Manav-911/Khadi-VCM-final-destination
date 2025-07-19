import React, { useState } from 'react';
import '../../styles/meeting.css';

export default function MeetingRequestForm() {
  const [meeting, setMeeting] = useState({
    title: '',
    date: '',
    duration: '',
    participants: '',
    description: ''
  });

  const handleChange = (e) => {
    setMeeting({ ...meeting, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Meeting requested:', meeting);
  };

  return (
    <form onSubmit={handleSubmit} className="meeting-form full-width-view">
      <h3>Request a New Meeting</h3>
      <input
        type="text"
        name="title"
        placeholder="Meeting Title"
        value={meeting.title}
        onChange={handleChange}
        required
      />
      <input
        type="date"
        name="date"
        value={meeting.date}
        onChange={handleChange}
        required
      />
      <input
        type="time"
        name="time"
        value={meeting.time}
        onChange={handleChange}
        required
      />
      <input
        type="number"
        name="duration"
        placeholder="Duration in minutes"
        value={meeting.duration}
        onChange={handleChange}
        required
      />
      <input
        type="text"
        name="participants"
        placeholder="Participants (comma separated)"
        value={meeting.participants}
        onChange={handleChange}
        required
      />
      <textarea
        name="description"
        placeholder="Meeting Description"
        value={meeting.description}
        onChange={handleChange}
      />
      <button type="submit">Submit Request</button>
    </form>
  );
}
