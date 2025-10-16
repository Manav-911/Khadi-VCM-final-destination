import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/page.css";
import { useState } from "react";
import axiosInstance from "../config/axiosConfig"; // Use configured axios
import { useEffect } from "react";
import "../App.css";

function tab4() {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [declinedMeetings, setDeclinedMeetings] = useState([]);
  const [pendingMeetings, setPendingMeetings] = useState([]);
  const [fetchError, setFetchError] = useState(false);
  const [fetchMeetings, setfetchMeetings] = useState(null);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [availableLicenses, setAvailableLicenses] = useState([]);

  //check Availability
  useEffect(() => {
    const fetchAvailability = async () => {
      if (!selectedMeeting) return;

      try {
        const [roomsRes, licensesRes] = await Promise.all([
          axiosInstance.get(
            `/admin/available-rooms?meeting_id=${selectedMeeting.id}`
          ),
          axiosInstance.get(
            `/admin/available-licenses?meeting_id=${selectedMeeting.id}`
          ),
        ]);

        setAvailableRooms(roomsRes.data);
        setAvailableLicenses(licensesRes.data.licenses);
      } catch (err) {
        console.error("Error fetching availability:", err);
      }
    };

    fetchAvailability();
  }, [selectedMeeting]);

  const handleApprove = async () => {
    if (!selectedMeeting) return;

    try {
      const res = await axiosInstance.post("/admin/approve-meeting", {
        meeting_id: selectedMeeting.id,
      });

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
      await axiosInstance.post("/api/meetings/decline", {
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
      await axiosInstance.post("/api/meetings/pending", {
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
      try {
        const response = await axiosInstance.get("/admin/pending-request");

        if (response.data) {
          setfetchMeetings(response.data);
          console.log("Fetched meetings:", response.data);
          setFetchError(null);
        }
      } catch (error) {
        console.error("Error fetching meetings:", error);
        setFetchError("Could not fetch data");
        setfetchMeetings(null);
      }
    };

    fetchallMeetings();
  }, []);

  const formatStr = (str) =>
    new Date(str).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "UTC",
    });

  return (
    <div className="right-panel-meeting">
      <h3>MEETING DETAILS</h3>
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
            <th>ROOM STATUS</th>
            <th>DATE & TIME</th>
            <th>STATUS</th>
            <th>LICENSE</th>
            <th>ROOMS AVAIL</th>
          </tr>
        </thead>
        <tbody>
          {fetchError && (
            <tr>
              <td colSpan="6" style={{ color: "red" }}>
                {fetchError}
              </td>
            </tr>
          )}

          {fetchMeetings === null ? (
            <tr>
              <td colSpan="6">Loading...</td>
            </tr>
          ) : fetchMeetings.length === 0 ? (
            <tr>
              <td colSpan="6">No meetings yet</td>
            </tr>
          ) : (
            fetchMeetings.map((f) => (
              <tr
                key={f.id}
                onClick={() => setSelectedMeeting(f)}
                className={`${
                  f.hasAvailableLicense ? "available" : "unavailable"
                } tablerow`}
              >
                <td>{f.id}</td>
                <td>{f.title}</td>
                <td>{f.want_room ? "Yes" : "No"}</td>
                <td>{formatStr(f.start_time)}</td>
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
  );
}

export default tab4;
