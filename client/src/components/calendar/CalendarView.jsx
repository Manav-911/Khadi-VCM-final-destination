import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import MeetingService from '../../services/eventService';
import '../calendar/calendarview.css'

export default function CalendarView() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch meetings from API
  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const meetingsData = await MeetingService.getAllMeetings();
      setMeetings(meetingsData);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch meetings:', err);
      setError('Failed to load meetings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  // Handle meeting click (for viewing only)
  const handleEventClick = (clickInfo) => {
    const meeting = clickInfo.event;
    const props = meeting.extendedProps;
    
    const meetingInfo = `
Meeting: ${meeting.title}
Description: ${props.description || 'No description'}
Start: ${meeting.start.toLocaleString()}
End: ${meeting.end.toLocaleString()}
Status: ${props.status || 'pending'}
Duration: ${props.duration_minutes || 60} minutes
Room: ${props.conference_room_name || 'No room assigned'}
Requested by: ${props.requested_by_name || 'Unknown'}
${props.link ? `Link: ${props.link}` : ''}
    `.trim();

    alert(meetingInfo);
  };

  if (loading) {
    return <div className="calendar-loading">Loading meetings...</div>;
  }

  if (error) {
    return (
      <div className="calendar-error">
        <p>{error}</p>
        <button onClick={fetchMeetings}>Retry</button>
      </div>
    );
  }

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <h2>Meeting Calendar</h2>
      </div>

      <div className="calendar-instructions">
        💡 Click on meetings to view details
      </div>

      <FullCalendar
        plugins={[timeGridPlugin]}
        initialView="timeGridWeek"
        events={meetings}
        height="auto"
        slotMinTime="00:00:00"
        slotMaxTime="24:00:00"
        allDaySlot={false}
        nowIndicator={true}
        editable={false}
        selectable={false}
        eventClick={handleEventClick}
        eventDidMount={(info) => {
          const desc = info.event.extendedProps.description;
          if (desc) {
            info.el.setAttribute('title', desc);
          }
        }}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'timeGridWeek,timeGridDay'
        }}
        slotDuration="00:30:00"
        slotLabelInterval="01:00:00"
        eventOverlap={false}
        slotEventOverlap={false}
        businessHours={{
          daysOfWeek: [1, 2, 3, 4, 5], // Monday - Friday
          startTime: '09:00',
          endTime: '17:00'
        }}
      />
    </div>
  );
}