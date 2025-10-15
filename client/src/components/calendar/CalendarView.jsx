import React, { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import MeetingService from "../../services/eventService";
import "../calendar/calendarview.css";
import axios from "axios";

export default function CalendarView() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMeeting, setSelectedMeeting] = useState(null);

  // Fetch meetings from API
  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const meetingsData = await axios.get(
        "http://localhost:3000/meeting/approved_meetings",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          withCredentials: true,
        }
      );
      setMeetings(meetingsData);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch meetings:", err);
      setError("Failed to load meetings. Please try again.");
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

    setSelectedMeeting({
      title: meeting.title,
      description: props.description || "No description",
      start: meeting.start.toLocaleString(),
      end: meeting.end.toLocaleString(),
      status: props.status || "pending",
      duration: props.duration_minutes || 60,
      room: props.conference_room_name || "No room assigned",
      requestedBy: props.requested_by_name || "Unknown",
      link: props.link || null,
    });
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
            info.el.setAttribute("title", desc);
          }
        }}
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "timeGridWeek,timeGridDay",
        }}
        slotDuration="00:30:00"
        slotLabelInterval="01:00:00"
        eventOverlap={false}
        slotEventOverlap={false}
        businessHours={{
          daysOfWeek: [1, 2, 3, 4, 5], // Monday - Friday
          startTime: "09:00",
          endTime: "17:00",
        }}
      />
      {selectedMeeting && (
        <div
          className="meeting-modal-overlay"
          onClick={() => setSelectedMeeting(null)}
        >
          <div className="meeting-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="close-button"
              onClick={() => setSelectedMeeting(null)}
            >
              ×
            </button>
            <h2>{selectedMeeting.title}</h2>
            <p>
              <strong>Description:</strong> {selectedMeeting.description}
            </p>
            <p>
              <strong>Start:</strong> {selectedMeeting.start}
            </p>
            <p>
              <strong>End:</strong> {selectedMeeting.end}
            </p>
            <p>
              <strong>Status:</strong> {selectedMeeting.status}
            </p>
            <p>
              <strong>Duration:</strong> {selectedMeeting.duration} minutes
            </p>
            <p>
              <strong>Room:</strong> {selectedMeeting.room}
            </p>
            <p>
              <strong>Requested by:</strong> {selectedMeeting.requestedBy}
            </p>
            {selectedMeeting.link && (
              <p>
                <strong>Link:</strong>{" "}
                <a href={selectedMeeting.link} target="_blank" rel="noreferrer">
                  {selectedMeeting.link}
                </a>
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
