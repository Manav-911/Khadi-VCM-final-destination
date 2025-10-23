import React from "react";
import "../styles/page.css";
import { useState } from "react";
import axios from "axios";
import { useEffect } from "react";
import "../App.css";

const URL = "http://localhost:3000";

function Tab5() {
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [fetchError, setFetchError] = useState(null);
  const [fetchMeetings, setFetchMeetings] = useState(null);
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState("");
  const [status, setStatus] = useState("pending");
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "",
  }); // success, error, warning

  const toggleDropdown = () => setOpen(!open);

  // Show notification popup
  const showNotification = (message, type = "info") => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: "", type: "" });
    }, 5000);
  };

  const fetchAllMeetings = async (statusFilter = "pending") => {
    try {
      setLoading(true);
      setFetchError(null);

      const token = localStorage.getItem("token");
      console.log("📤 Fetching recording requests with status:", statusFilter);

      const response = await axios.get(
        `http://localhost:3000/admin/get-recording-request/${statusFilter}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        }
      );

      console.log("✅ Response received:", response.data);

      if (response.data?.requests) {
        setFetchMeetings(response.data.requests);
      } else {
        setFetchMeetings([]);
      }
    } catch (error) {
      console.error("❌ Error fetching recording requests:", error);

      let errorMessage = "Failed to load recording requests";

      if (error.response?.status === 500) {
        errorMessage = error.response.data?.error || "Server error occurred";
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data?.error || "Invalid request";
      } else if (error.code === "NETWORK_ERROR") {
        errorMessage = "Network error. Please check your connection.";
      }

      setFetchError(errorMessage);
      setFetchMeetings([]);
      showNotification(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  // Fetch when component mounts or status changes
  useEffect(() => {
    fetchAllMeetings(status);
  }, [status]);

  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
    setOpen(false);
    setAction("");
  };

  const handleApprove = async (request_id) => {
    try {
      const token = localStorage.getItem("token");

      console.log("Approving Request", request_id);

      const response = await axios.post(
        "http://localhost:3000/admin/accept-meeting-recording-request",
        { request_id },
        { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
      );

      console.log("Response from record approve: ", response.data);

      showNotification("Recording request approved successfully!", "success");
      fetchAllMeetings(status);
    } catch (error) {
      console.error("ERROR approving recording request: ", error);

      let errorMessage = "Failed to approve recording request";

      if (error.response?.status === 404) {
        errorMessage =
          error.response.data?.message || "Recording not available yet";
      } else if (error.response?.status === 500) {
        errorMessage = error.response.data?.error || "Server error occurred";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      showNotification(errorMessage, "error");
    }
  };

  const handleDecline = async (request_id) => {
    try {
      const token = localStorage.getItem("token");

      const response = await axios.post(
        "http://localhost:3000/admin/decline-recording-request",
        { request_id },
        { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
      );

      showNotification("Recording request declined", "info");
      fetchAllMeetings(status);
    } catch (error) {
      console.error("ERROR declining recording request: ", error);
      showNotification("Failed to decline recording request", "error");
    }
  };

  const formatStr = (str) =>
    new Date(str).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "UTC",
    });

  return (
    <div className="right-panel-meeting">
      {/* Notification Popup */}
      {notification.show && (
        <div className={`notification-popup ${notification.type}`}>
          <div className="notification-content">
            <span className="notification-icon">
              {notification.type === "success" && "✅"}
              {notification.type === "error" && "❌"}
              {notification.type === "warning" && "⚠️"}
              {notification.type === "info" && "ℹ️"}
            </span>
            <span className="notification-message">{notification.message}</span>
            <button
              className="notification-close"
              onClick={() =>
                setNotification({ show: false, message: "", type: "" })
              }
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h3>RECORDING REQUESTS</h3>
          </div>
          <div className="request-meeting">
            <button
              className="btn"
              onClick={() => {
                toggleDropdown();
                setAction((prev) => (prev === "status" ? "" : "status"));
              }}
            >
              {action === "status" ? "▼ Status" : "▲ Status"} -{" "}
              {status.toUpperCase()}
            </button>
            {open && (
              <div className="dropdown-menu">
                <button
                  className="dropdown-item"
                  onClick={() => handleStatusChange("pending")}
                >
                  Pending
                </button>
                <button
                  className="dropdown-item"
                  onClick={() => handleStatusChange("approved")}
                >
                  Approved
                </button>
                <button
                  className="dropdown-item"
                  onClick={() => handleStatusChange("rejected")}
                >
                  Rejected
                </button>
                <button
                  className="dropdown-item"
                  onClick={() => handleStatusChange("completed")}
                >
                  Completed
                </button>
              </div>
            )}
          </div>
        </div>

        <button className="clear-btn" onClick={() => setSelectedMeeting(null)}>
          CLEAR SELECTION
        </button>

        {/* Error Display */}
        {fetchError && <div className="error-message">❌ {fetchError}</div>}

        {selectedMeeting ? (
          <div className="meeting-details">
            <p>
              <strong>Request ID:</strong> {selectedMeeting.request_id}
            </p>
            <p>
              <strong>Meeting Title:</strong> {selectedMeeting.meeting_title}
            </p>
            <p>
              <strong>Requester:</strong> {selectedMeeting.requester_name} (
              {selectedMeeting.requester_email})
            </p>
            <p>
              <strong>Date & Time:</strong>{" "}
              {formatStr(selectedMeeting.start_time)}
            </p>
            <p>
              <strong>Duration:</strong> {selectedMeeting.duration_minutes}{" "}
              minutes
            </p>
            <p>
              <strong>Status:</strong>{" "}
              <span
                className={`status ${selectedMeeting.status?.toLowerCase()}`}
              >
                {selectedMeeting.status}
              </span>
            </p>

            {selectedMeeting.recording_url ? (
              <div className="recording-available">
                <p>
                  <strong>Recording URL:</strong>{" "}
                  <a
                    href={selectedMeeting.recording_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View Recording
                  </a>
                </p>
                <span className="success-badge">✅ Recording Available</span>
              </div>
            ) : (
              <div className="action-buttons">
                <button
                  className="approve-btn"
                  onClick={() => handleApprove(selectedMeeting.request_id)}
                >
                  APPROVE & FETCH RECORDING
                </button>
                <button
                  className="decline-btn"
                  onClick={() => handleDecline(selectedMeeting.request_id)}
                >
                  DECLINE
                </button>
              </div>
            )}
          </div>
        ) : (
          <p>Select a recording request to view details</p>
        )}

        <br />

        {/* Loading State */}
        {loading && (
          <div className="loading">Loading recording requests...</div>
        )}

        <table className="meeting-table">
          <thead>
            <tr>
              <th>REQUEST ID</th>
              <th>MEETING TITLE</th>
              <th>REQUESTED BY</th>
              <th>DATE & TIME</th>
              <th>STATUS</th>
              <th>RECORDING</th>
            </tr>
          </thead>
          <tbody>
            {!loading && fetchMeetings && fetchMeetings.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: "center" }}>
                  No {status} recording requests found
                </td>
              </tr>
            ) : (
              fetchMeetings?.map((f) => (
                <tr
                  key={f.request_id}
                  onClick={() => setSelectedMeeting(f)}
                  className={
                    selectedMeeting?.request_id === f.request_id
                      ? "selected-row"
                      : ""
                  }
                >
                  <td>{f.request_id}</td>
                  <td>{f.meeting_title}</td>
                  <td>{f.requester_name}</td>
                  <td>{new Date(f.start_time).toLocaleString()}</td>
                  <td>
                    <span className={`status ${f.status?.toLowerCase()}`}>
                      {f.status}
                    </span>
                  </td>
                  <td>
                    {f.recording_url ? (
                      <span className="recording-badge available">
                        ✅ Available
                      </span>
                    ) : (
                      <span className="recording-badge pending">
                        ⏳ Pending
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Tab5;
