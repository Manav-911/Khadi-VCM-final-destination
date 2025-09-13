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
  const [availableRooms, setAvailableRooms] = useState([]);
  const [availableLicenses, setAvailableLicenses] = useState([]);

  //check Availabilty
  useEffect(() => {
    const fetchAvailability = async () => {
      if (!selectedMeeting) return;
      const token = localStorage.getItem("token");

      const [roomsRes, licensesRes] = await Promise.all([
        axios.get(
          `http://localhost:3000/admin/available-rooms?meeting_id=${selectedMeeting.id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        ),
        axios.get(
          `http://localhost:3000/admin/available-licenses?meeting_id=${selectedMeeting.id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        ),
      ]);

      setAvailableRooms(roomsRes.data);
      setAvailableLicenses(licensesRes.data.licenses);
    };

    fetchAvailability();
  }, [selectedMeeting]);

  // ✅ Needed for navigation

  const handleApprove = async () => {
    if (!selectedMeeting) return;

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:3000/admin/approve-meeting",
        { meeting_id: selectedMeeting.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("✅ Approved:", res.data);

      // Refresh pending meetings
      setfetchMeetings(
        fetchMeetings.filter((m) => m.id !== selectedMeeting.id)
      );
      setSelectedMeeting(null);

      alert(
        `Meeting approved!\nLicense: ${res.data.assignedLicense}\nRoom: ${
          res.data.assignedRoom || "Not required"
        }`
      );
    } catch (err) {
      console.error("Error approving meeting:", err);
      alert(err.response?.data?.message || "Approval failed");
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
          <button
            className="clear-btn"
            onClick={() => setSelectedMeeting(null)}
          >
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
              {selectedMeeting.status && (
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
              {fetchError && <p>{fetchError}</p>}

              {fetchMeetings === null ? null : fetchMeetings.length === 0 ? (
                <tr>
                  <td colSpan="6">No meetings yet</td>
                </tr>
              ) : (
                fetchMeetings.map((f) => (
                  <tr
                    key={f.id}
                    onClick={() => setSelectedMeeting(f)}
                    className={
                      f.hasAvailableLicense ? "available" : "unavailable"
                    }
                  >
                    <td>{f.id}</td>
                    <td>{f.title}</td>
                    <td>{f.want_room ? "Yes" : "No"}</td>
                    <td>{f.start_time}</td>
                    <td>{f.status}</td>
                    <td
                      style={{
                        color: f.hasAvailableLicense ? "green" : "red",
                        fontWeight: "bold",
                      }}
                    >
                      {f.licenseInfo}
                    </td>
                    <td>
                      {f.want_room ? (
                        availableRooms.length > 0 ? (
                          <span style={{ color: "green", fontWeight: "bold" }}>
                            {availableRooms.length} available
                          </span>
                        ) : (
                          <span style={{ color: "red", fontWeight: "bold" }}>
                            No rooms
                          </span>
                        )
                      ) : (
                        "Not required"
                      )}
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
