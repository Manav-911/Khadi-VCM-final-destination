import React, { useState, useEffect } from "react";
import MeetingService from "../../services/eventService";
import "./PreviousMeeting.css";

export default function PreviousMeeting() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const meetingsData = await MeetingService.getMeetingsForUser();
      console.log("Fetched meetings:", meetingsData);

      // Filter only concluded meetings (end date in the past)
      const now = new Date();
      const concludedMeetings = meetingsData.filter(
        (m) => m.end && new Date(m.end) <= now
      );

      setMeetings(concludedMeetings);
      setError(false);
    } catch (err) {
      console.error("Failed to fetch meetings:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  // Filter meetings by search and date
  const filteredMeetings = meetings.filter((m) => {
    const titleMatch =
      search === "" || m.title?.toLowerCase().includes(search.toLowerCase());

    const dateMatch =
      !selectedDate ||
      (m.start && m.start.split("T")[0] === selectedDate);

    return titleMatch && dateMatch;
  });

  if (loading) {
    return (
      <div className="pm-spinner">
        <div className="pm-loader"></div>
      </div>
    );
  }

  if (error) {
    return <div className="pm-error">Error loading meetings.</div>;
  }

  return (
    <div className="pm-container">
      <h2 className="pm-title">Previously Attended Meetings</h2>

      {/* Search + Date Filters */}
      <div className="pm-filters">
        <div className="ps-searchbar-wrap">
          <input
            className="ps-search"
            type="text"
            placeholder="Search by meeting title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="pm-date-filter"
          max={new Date().toISOString().split("T")[0]} // Grey out future dates
        />
      </div>

      <div className="pm-grid">
        {filteredMeetings.length > 0 ? (
          filteredMeetings.map((meeting) => (
            <div className="pm-card" key={meeting.id}>
              <div className="pm-card-body">
                <div className="pm-card-title">{meeting.title}</div>
                <div className="pm-card-desc">
                  {meeting.extendedProps?.description ||
                    "No description available"}
                </div>
                <div className="pm-card-info">
                  <span>
                    <strong>Date:</strong>{" "}
                    {meeting.start
                      ? new Date(meeting.start).toLocaleDateString()
                      : "N/A"}
                  </span>
                  <span>
                    <strong>Time:</strong>{" "}
                    {meeting.start
                      ? new Date(meeting.start).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "N/A"}
                  </span>
                </div>
                <button className="pm-btn">Request Recording</button>
              </div>
            </div>
          ))
        ) : (
          <div className="pm-no-meetings">No meetings found</div>
        )}
      </div>
    </div>
  );
}
