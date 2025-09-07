import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/page.css";
import { BrowserRouter, Route, Router, Routes } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import { useEffect } from "react";
import "../App.css";
import CalendarView from "../components/calendar/CalendarView.jsx";
import supabase from "../config/supabaseClient.js";
const URL = "http://localhost:5000";

function tab1() {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [approvedMeetings, setApprovedMeetings] = useState([]);
  const [declinedMeetings, setDeclinedMeetings] = useState([]);
  const [pendingMeetings, setPendingMeetings] = useState([]);
  const [showApproved, setShowApproved] = useState(false);
  const [showDeclined, setShowDeclined] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [fetchMeetings, setfetchMeetings] = useState(null);
  const [showPending, setShowPending] = useState(false);

  // ✅ Needed for navigation

  const handleApprove = async () => {
    if (!selectedMeeting) {
      console.error("No meeting selected");
      return;
    }

    try {
      // await axios.post(`${URL}/api/meetings/approve`, {
      //  id: selectedMeeting.id });
      // const updatedMeeting = { ...selectedMeeting, status: 'APPROVED', approvedAt: new Date() };
      // setMeetings(meetings.filter(m => m.id !== selectedMeeting.id));
      // setApprovedMeetings([...approvedMeetings, updatedMeeting]);
      // setSelectedMeeting(null);
      const { data, err } = await supabase.from("meetings").insert([{}]);
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
        status: "pending",
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
    const fetchallMeetings = async () => {
      const token = localStorage.getItem("token");
      const { data, error } = await axios.get(
        "http://localhost:3000/admin/pending-request",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (error) {
        setFetchError("Could not fetch data");
        setfetchMeetings(null);
        console.log(error);
      }
      if (data) {
        setfetchMeetings(data);
        setFetchError(null);
      }
    };
    // const fetchMeetings = async () => {
    //   console.log("📡 Fetching from:", `${URL}/api/request/pending`);
    //   try {
    //     const response = await axios.get(`${URL}/api/meetings/request/pending`);
    //     console.log("✅ Meetings fetched:", response.data);
    //     setMeetings(response.data);
    //   } catch (error) {
    //     console.error("❌ Error fetching meetings:", error);
    //   }
    // };

    fetchallMeetings();
  }, []);

  return (
    <div className="container">
      <div className="right-panel-meeting">
        <div>
          <h3>MEETING DETAILS</h3>
          <button className="clear-btn" onClick={() => selectedMeeting(null)}>
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
                <strong>Date and Time:</strong> {selectedMeeting.start_time}
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
              {selectedMeeting.status === "pending" && (
                <>
                  <button className="approve-btn" onClick={handleApprove}>
                    APPROVE
                  </button>
                  <button className="decline-btn" onClick={handleDecline}>
                    DECLINE
                  </button>
                </>
              )}
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
                <th>ROOM STATUS</th>
                <th>DATE & TIME</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {/* {meetings.length === 0 ? (
                <tr><td colSpan="5">No meetings yet</td></tr>
              ) : (
                meetings.map((m) => (
                  <tr key={m.id} onClick={() => setSelectedMeeting(m)}>
                    <td>{m.id}</td>
                    <td>{m.meeting_title}</td>
                    <td>{m.participants}</td>
                    <td>{m.date} & {m.time}</td>
                    <td>
                      <span className={`status ${m.status?.toLowerCase()}`}>{m.status}</span>
                    </td>
                  </tr>
                ))
              )} */}
              {fetchError && <p>{fetchError}</p>}

              {fetchMeetings === null ? null : fetchMeetings.length === 0 ? (
                <tr>
                  <td colSpan="5">No meetings yet</td>
                </tr>
              ) : (
                fetchMeetings.map((f) => (
                  <tr key={f.id} onClick={() => setSelectedMeeting(f)}>
                    <td>{f.id}</td>
                    <td>{f.title}</td>
                    <td>{f.want_room ? "Yes" : "No"}</td>
                    <td>
                      {f.date} {f.start_time}
                    </td>
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
    </div>
  );
}

export default tab1;
