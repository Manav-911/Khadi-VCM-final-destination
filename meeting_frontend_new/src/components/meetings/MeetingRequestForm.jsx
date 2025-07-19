import React, { useState } from 'react';
import '../../styles/meeting.css';
import { useNavigate } from 'react-router-dom';

export default function MeetingRequestForm() {
  const navigate = useNavigate(); // ✅ Now defined
  const [meeting, setMeeting] = useState({
    title: '',
    date: '',
    duration: '',
    participants: '',
    description: '',
    time: ''
  });

  const handleChange = (e) => {
    setMeeting({ ...meeting, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Meeting requested:', meeting);
    try {
      const res = await fetch('http://localhost:5000/api/meetings/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(meeting),
      });

      const data = await res.json();
      if (res.ok) {
        console.log('Meeting stored:', data.data);
        alert('Meeting request submitted!');
        setMeeting({ title: '', date: '', time: '', duration: '', participants: '', description: '' });
        navigate('/'); // ✅ Move inside the success block
      } else {
        console.error('Error from server:', data.error);
      }
    } catch (err) {
      console.error('Network error:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="meeting-form full-width-view">
      <h3>Request a New Meeting</h3>
      <input type="text" name="title" placeholder="Meeting Title" value={meeting.title} onChange={handleChange} required />
      <input type="date" name="date" value={meeting.date} onChange={handleChange} required />
      <input type="time" name="time" value={meeting.time} onChange={handleChange} required />
      <input type="number" name="duration" placeholder="Duration in minutes" value={meeting.duration} onChange={handleChange} required />
      <input type="text" name="participants" placeholder="Participants (comma separated)" value={meeting.participants} onChange={handleChange} required />
      <textarea name="description" placeholder="Meeting Description" value={meeting.description} onChange={handleChange} />
      <button type="submit">Submit Request</button>
    </form>
  );
}
