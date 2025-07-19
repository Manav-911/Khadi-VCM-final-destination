import React from 'react';
import '../../styles/meeting.css';

export default function MeetingList() {
  const meetings = [
    {
      id: 1,
      title: 'Product Strategy Review',
      time: '10:00 AM - 11:30 AM',
      participants: 'John, Jane, Raj'
    },
    {
      id: 2,
      title: 'Marketing Sync',
      time: '2:00 PM - 3:00 PM',
      participants: 'Team Leads'
    }
  ];

  return (
    <div className="meeting-list">
      {meetings.map(meeting => (
        <div key={meeting.id} className="meeting-item">
          <h4>{meeting.title}</h4>
          <p className="meeting-time">{meeting.time}</p>
          <p className="meeting-participants">{meeting.participants}</p>
        </div>
      ))}
    </div>
  );
}
