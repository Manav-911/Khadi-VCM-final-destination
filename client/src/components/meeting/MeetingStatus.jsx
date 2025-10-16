import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import "./meetingstatus.css";

export default function MeetingStatus() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  // ✅ Fetch only approved meetings
  const fetchUserMeetings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(
        `http://localhost:3000/meeting/approved_meetings`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          withCredentials: true,
        }
      );

      const allUserMeetings = response.data;
      console.log(allUserMeetings);

      // ✅ Filter for only approved & future meetings
      const now = new Date();
      const approvedMeetings = allUserMeetings.filter((m) => {
        const meetingStart = m.start ? new Date(m.start) : null;
        const status = m.status || m.extendedProps?.status;
        return status === "approved" && meetingStart && meetingStart > now;
      });
      console.log(approvedMeetings);

      setMeetings(approvedMeetings);
    } catch (err) {
      console.error("Failed to fetch user meetings:", err);
      setError("Failed to fetch user meetings. Please try again.");
      setMeetings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserMeetings();
  }, [fetchUserMeetings]);

  // ✅ Cancel meeting function
  const handleCancel = async (meetingId) => {
    if (!window.confirm("Are you sure you want to cancel this meeting?"))
      return;

    try {
      await axios.delete(
        `http://localhost:3000/meeting/cancelUserMeeting/${meetingId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      alert("Meeting cancelled successfully.");
      fetchUserMeetings();
    } catch (err) {
      console.error("Error cancelling meeting:", err);
      alert("Failed to cancel meeting. Please try again.");
    }
  };

  const filteredMeetings = meetings.filter((m) => {
    const titleMatch =
      search === "" || m.title?.toLowerCase().includes(search.toLowerCase());
    const dateMatch =
      !selectedDate || (m.start && m.start.split("T")[0] === selectedDate);
    return titleMatch && dateMatch;
  });

  if (loading) {
    return (
      <div className="ums-spinner">
        <div className="ums-loader"></div>
      </div>
    );
  }

  if (error) {
    return <div className="ums-error">{error}</div>;
  }

  return (
    <div className="ums-container">
      <h2 className="ums-title">My Approved Meetings</h2>

      <div className="ums-filters">
        <div className="ums-searchbar-wrap">
          <input
            className="ums-search"
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
          className="ums-date-filter"
        />
      </div>

      <div className="ums-grid">
        {filteredMeetings.length > 0 ? (
          filteredMeetings.map((meeting) => (
            <div className="ums-card" key={meeting.id}>
              <div className="ums-card-body">
                <div className="ums-header">
                  <div className="ums-card-title">{meeting.title}</div>
                  <span className="ums-status status-approved">APPROVED</span>
                </div>
                <div className="ums-card-desc">
                  {meeting.extendedProps?.description ||
                    "No description available"}
                </div>
                <div className="ums-card-info">
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
                <button
                  className="ums-btn ums-btn-denied"
                  onClick={() => handleCancel(meeting.id)}
                >
                  Cancel Meeting
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="ums-no-meetings">No approved meetings found.</div>
        )}
      </div>
    </div>
  );
}
