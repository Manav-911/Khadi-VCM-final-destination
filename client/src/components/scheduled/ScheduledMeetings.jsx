import React, { useEffect, useState } from "react";
import MeetingService from "../../services/eventService";
import "../scheduled/scheduledmeetings.css";
import { useMeetingContext } from "../context/MeetingContext"; // ✅ Import context
import axios from "axios";

export default function ScheduledMeetings() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const { refreshFlag } = useMeetingContext(); // ✅ Use context

  useEffect(() => {
    async function fetchMeetings() {
      try {
        setLoading(true);
        const res = await axios.get(
          "http://localhost:3000/meeting/approved_meetings",
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            withCredentials: true,
          }
        );

        // Access the actual data
        const meetingsData = res.data;

        const now = new Date();

        const upcoming = meetingsData
          .filter((meeting) => new Date(meeting.start) > now)
          .sort((a, b) => new Date(a.start) - new Date(b.start));

        setMeetings(upcoming);
      } catch (err) {
        console.error("Error fetching meetings:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchMeetings();
  }, [refreshFlag]); // ✅ Re-run when refreshFlag changes

  const formatTime = (date) => {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    } else {
      return date.toLocaleDateString([], {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    }
  };

  if (loading) {
    return (
      <aside className="scheduled-meetings">
        <h3 className="meetings-title">Upcoming Meetings</h3>
        <div className="no-meetings">Loading meetings...</div>
      </aside>
    );
  }

  return (
    <aside className="scheduled-meetings">
      <h3 className="meetings-title">Upcoming Meetings</h3>
      {meetings.length === 0 ? (
        <p className="no-meetings">No upcoming meetings scheduled</p>
      ) : (
        <div className="meetingHolder">
          {meetings.map((meeting) => {
            const start = new Date(meeting.start);
            const end = new Date(meeting.end);

            return (
              <div key={meeting.id} className="meeting-card">
                <div className="meeting-title-date">
                  <strong className="meeting-title">{meeting.title}</strong>
                  <span className="meeting-date">{formatDate(start)}</span>
                </div>

                <div className="meeting-time">
                  {formatTime(start)} – {formatTime(end)}
                </div>

                <div className="meeting-location">
                  📍 {meeting.conference_room?.name || "TBD"}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </aside>
  );
}
