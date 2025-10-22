import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/page.css";
import { BrowserRouter, Route, Router, Routes } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import { useEffect } from "react";
import "../App.css";
import CalendarView from "../components/calendar/CalendarView.jsx";
// import supabase from "../config/supabaseClient.js";
const URL = "http://localhost:3000";

function tab5() {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [approvedMeetings, setApprovedMeetings] = useState([]);
  const [declinedMeetings, setDeclinedMeetings] = useState([]);
  const [pendingMeetings, setPendingMeetings] = useState([]);
  const [showApproved, setShowApproved] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [fetchMeetings, setfetchMeetings] = useState(null);
  const [showDeclined, setShowDeclined] = useState(false);
  const [showPending, setShowPending] = useState(false);
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState("");
  const [status, setStatus] = useState("pending");
  // ✅ Needed for navigation

  const toggleDropdown = () => setOpen(!open);

  const handleApprove = async () => {
    if (!selectedMeeting) {
      console.error("No meeting selected");
      return;
    }

    try {
      await axios.post(`${URL}/admin/approve-meeting`, {
        id: selectedMeeting.id,
      });
      const updatedMeeting = {
        ...selectedMeeting,
        status: "APPROVED",
        approvedAt: new Date(),
      };
      setMeetings(meetings.filter((m) => m.id !== selectedMeeting.id));
      setApprovedMeetings([...approvedMeetings, updatedMeeting]);
      setSelectedMeeting(null);
    } catch (err) {
      console.error("Error approving meeting:", err);
    }
  };

  const handleDecline = async () => {
    if (!selectedMeeting) return;
    try {
      await axios.post(`${URL}/api/meetings/decline`, {
        id: selectedMeeting.id,
      });
      const updatedMeeting = {
        ...selectedMeeting,
        status: "DECLINED",
        declinedAt: new Date(),
      };
      setMeetings(meetings.filter((m) => m.id !== selectedMeeting.id));
      setDeclinedMeetings([...declinedMeetings, updatedMeeting]);
      setSelectedMeeting(null);
    } catch (err) {
      console.error("Error declining meeting:", err);
    }
  };

  const handlePending = async () => {
    if (!selectedMeeting) return;
    try {
      await axios.post(`${URL}/api/meetings/pending`, {
        id: selectedMeeting.id,
      });
      const updatedMeeting = {
        ...selectedMeeting,
        status: "PENDING",
        pendingAt: new Date(),
      };
      setMeetings(meetings.filter((m) => m.id !== selectedMeeting.id));
      setPendingMeetings([...pendingMeetings, updatedMeeting]);
      setSelectedMeeting(null);
    } catch (err) {
      console.error("Error pending meeting:", err);
    }
  };
  useEffect(() => {
    // if (!status) return;
      const fetchallMeetings = async () => {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `http://localhost:3000/admin/recording-requests/${status}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data?.requests) {
        setfetchMeetings(response.data.requests); // ✅ FIXED
        setFetchError(null);
      }
    };
    // const fetchMeetings = async () => {
    //   console.log("📡 Fetching from:", `${URL}/api/request/approve`);
    //   try {
    //     const response = await axios.get(`${URL}/api/meetings/request/approve`);
    //     console.log("✅ Meetings fetched:", response.data);
    //     setMeetings(response.data);
    //   } catch (error) {
    //     console.error("❌ Error fetching meetings:", error);
    //   }
    // };

    fetchallMeetings();
  }, []);
  const formatStr = (str) =>
    new Date(str).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "UTC",
    });
  console.log("selectedMeeting", selectedMeeting);

  return (
    <div className="right-panel-meeting">
      <div>
        <div style={{display:'flex'}}> 
          <div>
            <h3>MEETING DETAILS</h3>
          </div>
          <div className="request-meeting">
            <button
              className="btn"
              onClick={() => {
                toggleDropdown();
                // Toggle action between "status" and "" (or null)
                setAction(prev => (prev === "status" ? "" : "status"));
              }}
            >
              {action === "status" ? "▼ Status" : "▲ Status"}
            </button>
            {open && (
              <div className="dropdown-menu">
                <button className="dropdown-item" onClick={() => setStatus("approved")}>Approve</button>
                <button className="dropdown-item" onClick={() => setStatus("rejected")}>Rejected</button>
                <button className="dropdown-item" onClick={() => setStatus("pending")}>Pending</button>
                <button className="dropdown-item" onClick={() => setStatus("completed")}>Completed</button>
              </div>
            )}
          </div>
          </div>
          <button className="clear-btn" onClick={() => setSelectedMeeting(null)}>
            CLEAR
          </button>
        {selectedMeeting ? (
          <>
            <p>
              <strong>Meeting ID:</strong> {selectedMeeting.id}
            </p>
            <p>
              <strong>Title:</strong> {selectedMeeting.title}
            </p>
            <p>
              <strong>Date and Time:</strong>{" "}
              {formatStr(selectedMeeting.start_time)}
              <br />
            </p>
            <p>
              <strong>Purpose:</strong>
              <br />
              {selectedMeeting.description}
            </p>
            <p>
              <strong>Status:</strong> {selectedMeeting.status}
            </p>
          </>
        ) : (
          <p>Select a meeting to view details</p>
        )}

        <br />
        <br />

        <table className="meeting-table">
          <thead>
            <tr className="meeting-table tr">
              <th>ID</th>
              <th>MEETING TITLE</th>
              {/* <th>DESCRIPTION</th> */}
              <th>PARTICIPANTS</th>
              <th>DATE & TIME</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {/*{meetings.length === 0 ? (
                <tr>
                  <td colSpan="5">No meetings yet</td>
                </tr>
              ) : (
                meetings.map((m) => (
                  <tr key={m.id} onClick={() => setSelectedMeeting(m)}>
                    <td>{m.id}</td>
                    <td>{m.meeting_title}</td>
                    <td>{m.participants}</td>
                    <td>
                      {m.date} & {m.time}
                    </td>
                    <td>
                      <span className={`status ${m.status?.toLowerCase()}`}>
                        {m.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}*/}

            {fetchError && <p>{fetchError}</p>}

            {fetchMeetings === null ? null : fetchMeetings.length === 0 ? (
              <tr>
                <td colSpan="5">No meetings yet</td>
              </tr>
            ) : (
              fetchMeetings.map((f) => (
                <tr key={f.id} onClick={() => setSelectedMeeting(f)}>
                  <td>{f.request_id}</td>
                  <td>{f.meeting_title}</td>
                  <td>{f.requester_name}</td>
                  <td>{new Date(f.start_time).toLocaleString()}</td>
                  <td>
                    <span className={`status ${f.status?.toLowerCase()}`}>
                      {f.status}
                    </span>
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

export default tab5;
