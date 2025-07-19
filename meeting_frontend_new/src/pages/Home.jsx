import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../App.css';
import { useNavigate } from 'react-router-dom';
import Dashboard from './Dashboard';

const URL = 'http://localhost:5000';

function Home() {
  const [meetings, setMeetings] = useState([]);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [approvedMeetings, setApprovedMeetings] = useState([]);
  const [showApproved, setShowApproved] = useState(false);
  const navigate = useNavigate(); // ✅ Needed for navigation

  const simulateMeetingRequest = async () => {
    const newMeeting = {
      id: `M–${1000 + meetings.length + 1}`,
      title: 'Team Sync',
      organizer: 'Aarav',
      date: '18 June',
      time: '04:00 PM',
      status: 'PENDING',
      email: 'aarav@email.com',
      purpose: 'Weekly sync-up discussion',
    };
    try {
      const res = await axios.post(`${URL}/api/meetings`, newMeeting);
      setMeetings([...meetings, res.data.newMeeting]);
    } catch (err) {
      console.log('Error adding meeting');
    }
  };

  const handleApprove = async () => {
    if (!selectedMeeting) {
      console.error('No meeting selected');
      return;
    }

    try {
      await axios.post(`${URL}/api/meetings/approve`, { id: selectedMeeting.id });
      const updatedMeeting = { ...selectedMeeting, status: 'APPROVED', approvedAt: new Date() };
      setMeetings(meetings.filter(m => m.id !== selectedMeeting.id));
      setApprovedMeetings([...approvedMeetings, updatedMeeting]);
      setSelectedMeeting(null);
    } catch (err) {
      console.error('Error approving meeting:', err);
    }
  };

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const res = await axios.get(`${URL}/api/meetings`);
        setMeetings(res.data);
      } catch (err) {
        console.log('Error fetching meetings');
      }
    };
    fetchMeetings();
  }, []);

  return (
    <div className="container">
      <h1>Pending Approvals</h1>

      <div className="header-buttons">
        <button className="schedule-btn" onClick={() => navigate('/dashboard')}>
          📅 Schedule Meeting
        </button>
        <button className="simulate-btn" onClick={simulateMeetingRequest}>
          ➕ Add Sample Meeting
        </button>
        <button className="view-approved-btn" onClick={() => setShowApproved(true)}>
          ✅ View Today's Approved Meetings
        </button>
      </div>

      <div className="content">
        <div className="left-panel">
          <h3>MEETING DETAILS</h3>
          <button className="clear-btn" onClick={() => setSelectedMeeting(null)}>CLEAR</button>
          {selectedMeeting ? (
            <>
              <p><strong>Meeting ID:</strong> {selectedMeeting.id}</p>
              <p><strong>Title:</strong> {selectedMeeting.title}</p>
              <p><strong>Date:</strong> {selectedMeeting.date}<br />{selectedMeeting.time} (IST)</p>
              <p><strong>Purpose:</strong><br />{selectedMeeting.purpose}</p>
              <p><strong>Email:</strong><br />{selectedMeeting.email}</p>
              <p><strong>Status:</strong> {selectedMeeting.status}</p>
              {selectedMeeting.status === 'PENDING' && (
                <button className="approve-btn" onClick={handleApprove}>APPROVE</button>
              )}
            </>
          ) : <p>Select a meeting to view details</p>}
        </div>

        <div className="right-panel">
          <table>
            <thead>
              <tr>
                <th>MEETING ID</th>
                <th>TITLE</th>
                <th>ORGANIZER</th>
                <th>DATE & TIME</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {meetings.length === 0 ? (
                <tr><td colSpan="5">No meetings yet</td></tr>
              ) : (
                meetings.filter(m => m && m.id).map((m) => (
                  <tr key={m.id} onClick={() => setSelectedMeeting(m)}>
                    <td>{m.id}</td>
                    <td>{m.title}</td>
                    <td>{m.organizer}</td>
                    <td>{m.date}, {m.time}</td>
                    <td>
                      <span className={`status ${m.status.toLowerCase()}`}>{m.status}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showApproved && (
        <div className="approved-panel">
          <div className="approved-header">
           <h3>✅ Approved Meetings Today</h3>
            <button className="close-approved" onClick={() => setShowApproved(false)}>Close</button>
          </div>
          <ul>
            {approvedMeetings
              .filter(m => new Date(m.approvedAt).toDateString() === new Date().toDateString())
              .map((m, index) => (
                <li key={index}>
                  {m.title} by {m.organizer} at {m.time} ({m.date})
                </li>
              ))}
            {approvedMeetings.filter(m => new Date(m.approvedAt).toDateString() === new Date().toDateString()).length === 0 && (
              <li>No approvals today.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export default Home
