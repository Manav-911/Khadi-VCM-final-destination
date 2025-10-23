import React, { useState, useEffect } from "react";
import MeetingService from "../../services/eventService";
import "./PreviousMeeting.css";
import axios from "axios";

export default function PreviousMeeting() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [loadingRecording, setLoadingRecording] = useState({}); // Track loading state per meeting
  const [requestStatus, setRequestStatus] = useState({}); // Track request status per meeting
  const [loadingAttendance, setLoadingAttendance] = useState({}); // Track loading state for attendance
  const [attendanceData, setAttendanceData] = useState({}); // Store attendance data per meeting

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
      console.log("Fetched meetings:", meetingsData);
      const data = meetingsData.data;

      // Filter only concluded meetings (end date in the past)
      const now = new Date();
      const concludedMeetings = data.filter(
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

  // Handle recording request
  const handleRequestRecording = async (meetingId, meetingTitle) => {
    try {
      // Set loading state for this specific meeting
      setLoadingRecording((prev) => ({ ...prev, [meetingId]: true }));

      const token = localStorage.getItem("token");

      console.log("📤 Frontend - Making recording request:", {
        meetingId,
        meetingTitle,
        tokenExists: !!token,
      });

      // Convert meetingId to number to ensure it's the correct type
      const numericMeetingId = Number(meetingId);

      const response = await axios.post(
        `http://localhost:3000/meeting/request-recording/${numericMeetingId}`,
        {}, // empty body
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          withCredentials: true,
          timeout: 10000,
        }
      );

      console.log("✅ Frontend - Recording request successful:", response.data);

      // Update request status
      setRequestStatus((prev) => ({
        ...prev,
        [meetingId]: {
          success: true,
          message:
            response.data.message ||
            "Recording request submitted successfully!",
        },
      }));
    } catch (err) {
      console.error("❌ Frontend - Failed to request recording:", {
        message: err.message,
        code: err.code,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        url: err.config?.url,
      });

      let errorMessage = "Failed to request recording. Please try again.";

      if (err.response?.status === 404) {
        errorMessage =
          "Recording request endpoint not found (404). Please contact administrator.";
      } else if (err.response?.status === 400) {
        errorMessage =
          err.response?.data?.message ||
          "You have already requested recording for this meeting.";
      } else if (err.response?.status === 403) {
        errorMessage =
          "You don't have permission to request recording for this meeting.";
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.code === "NETWORK_ERROR") {
        errorMessage = "Network error. Please check your connection.";
      } else if (err.code === "ECONNABORTED") {
        errorMessage = "Request timeout. Please try again.";
      }

      // Update request status with error
      setRequestStatus((prev) => ({
        ...prev,
        [meetingId]: {
          success: false,
          message: errorMessage,
        },
      }));
    } finally {
      // Clear loading state
      setLoadingRecording((prev) => ({ ...prev, [meetingId]: false }));

      // Clear status message after 5 seconds
      setTimeout(() => {
        setRequestStatus((prev) => {
          const newStatus = { ...prev };
          delete newStatus[meetingId];
          return newStatus;
        });
      }, 5000);
    }
  };

  // Handle fetch attendance
  const handleFetchAttendance = async (meetingId, meetingTitle) => {
    try {
      // Set loading state for this specific meeting
      setLoadingAttendance((prev) => ({ ...prev, [meetingId]: true }));

      const token = localStorage.getItem("token");

      console.log("📊 Fetching attendance for meeting:", {
        meetingId,
        meetingTitle,
      });

      const response = await axios.get(
        `http://localhost:3000/meeting/get-meeting-attendance/${meetingId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
          timeout: 10000,
        }
      );

      console.log("✅ Attendance data received:", response.data);

      // Store attendance data
      setAttendanceData((prev) => ({
        ...prev,
        [meetingId]: response.data,
      }));

      // Show success message
      setRequestStatus((prev) => ({
        ...prev,
        [meetingId]: {
          success: true,
          message: `Attendance data loaded! Total participants: ${response.data.totalParticipants}`,
        },
      }));
    } catch (err) {
      console.error("❌ Failed to fetch attendance:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });

      let errorMessage = "Failed to fetch attendance data.";

      if (err.response?.status === 404) {
        errorMessage = "Attendance data not available for this meeting.";
      } else if (err.response?.status === 403) {
        errorMessage =
          "You don't have permission to view attendance for this meeting.";
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }

      // Update request status with error
      setRequestStatus((prev) => ({
        ...prev,
        [meetingId]: {
          success: false,
          message: errorMessage,
        },
      }));
    } finally {
      // Clear loading state
      setLoadingAttendance((prev) => ({ ...prev, [meetingId]: false }));

      // Clear status message after 5 seconds
      setTimeout(() => {
        setRequestStatus((prev) => {
          const newStatus = { ...prev };
          delete newStatus[meetingId];
          return newStatus;
        });
      }, 5000);
    }
  };

  // Filter meetings by search and date
  const filteredMeetings = meetings.filter((m) => {
    const titleMatch =
      search === "" || m.title?.toLowerCase().includes(search.toLowerCase());

    const dateMatch =
      !selectedDate || (m.start && m.start.split("T")[0] === selectedDate);

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

                {/* Attendance Summary (if available) */}
                {attendanceData[meeting.id] && (
                  <div className="pm-attendance-summary">
                    <div className="attendance-stats">
                      <span>
                        👥 {attendanceData[meeting.id].totalParticipants} Total
                      </span>
                      <span>
                        ✅ {attendanceData[meeting.id].attendedCount} Present
                      </span>
                      <span>
                        📊 {attendanceData[meeting.id].attendanceRate}% Rate
                      </span>
                    </div>
                    <div className="attendance-preview">
                      {attendanceData[meeting.id].participants
                        .slice(0, 3)
                        .map((p, index) => (
                          <span
                            key={index}
                            className={`attendee ${
                              p.attended ? "present" : "absent"
                            }`}
                          >
                            {p.attended ? "✅" : "❌"} {p.name}
                          </span>
                        ))}
                      {attendanceData[meeting.id].participants.length > 3 && (
                        <span className="more-attendees">
                          +{attendanceData[meeting.id].participants.length - 3}{" "}
                          more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Status Message */}
                {requestStatus[meeting.id] && (
                  <div
                    className={`pm-status ${
                      requestStatus[meeting.id].success
                        ? "pm-status-success"
                        : "pm-status-error"
                    }`}
                  >
                    {requestStatus[meeting.id].message}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pm-action-buttons">
                  <button
                    className={`pm-btn pm-btn-attendance ${
                      loadingAttendance[meeting.id] ? "pm-btn-loading" : ""
                    }`}
                    onClick={() =>
                      handleFetchAttendance(meeting.id, meeting.title)
                    }
                    disabled={loadingAttendance[meeting.id]}
                  >
                    {loadingAttendance[meeting.id] ? (
                      <>
                        <div className="pm-btn-spinner"></div>
                        Loading...
                      </>
                    ) : (
                      <>📊 Attendance</>
                    )}
                  </button>

                  <button
                    className={`pm-btn ${
                      loadingRecording[meeting.id] ? "pm-btn-loading" : ""
                    }`}
                    onClick={() =>
                      handleRequestRecording(meeting.id, meeting.title)
                    }
                    disabled={loadingRecording[meeting.id]}
                  >
                    {loadingRecording[meeting.id] ? (
                      <>
                        <div className="pm-btn-spinner"></div>
                        Requesting...
                      </>
                    ) : (
                      "🎥 Request Recording"
                    )}
                  </button>
                </div>
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
