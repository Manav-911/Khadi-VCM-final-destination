import React, { useEffect, useState } from "react";
import "../styles/ScheduleMeeting.css";
import TextField from "@mui/material/TextField";
import supabase from "../config/supabaseClient";

function ScheduleMeeting({ open, onClose }) {
  if (!open) return null;

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Approved");

  const [participants, setParticipants] = useState([]); // fetched data
  const [selectedParticipants, setSelectedParticipants] = useState([]); // selected
  const [showParticipantsButton, setShowParticipantsButton] = useState(false);
  const [showParticipantsList, setShowParticipantsList] = useState(false);

  // Fetch participants from Supabase on load
  useEffect(() => {
    const fetchParticipants = async () => {
      const { data, error } = await supabase.from("users").select("id,name");
      if (error) console.log(error);
      else {
        console.log("Participation list : ", data);
        setParticipants(data);
      }
    };
    fetchParticipants();
  }, []);

  const handleParticipantSearchClick = () => {
    setShowParticipantsButton(true);
  };

  const handleShowParticipantsList = () => {
    setShowParticipantsList(true);
  };

  const handleCheckboxChange = (e, name) => {
    if (e.target.checked) {
      setSelectedParticipants((prev) => [...prev, name]);
    } else {
      setSelectedParticipants((prev) => prev.filter((p) => p !== name));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from("meetings").insert([
      {
        title,
        start_time,
        status,
        description,
      },
    ]);

    const { err } = await supabase.from("meeting_participants").insert([{}]);

    if (error) {
      console.error("Insert failed:", error);
    } else {
      alert("Meeting scheduled successfully!");
      onClose();
    }
  };

  return (
    <div className="overlay">
      <div className="popup">
        <h2>Schedule a Meeting</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="title"
            placeholder="Meeting Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <input
            type="text"
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
          <input
            type="time"
            name="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
          />
          <input type="text" name="status" value={status} readOnly required />
          <input
            type="number"
            name="duration"
            placeholder="Duration in minutes"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            required
          />

          <div>
            <TextField
              id="outlined-basic"
              variant="outlined"
              fullWidth
              label="🔍 Search Participants"
              onClick={handleParticipantSearchClick}
              value={participants.name}
            />

            {showParticipantsButton && (
              <div style={{ marginTop: "10px" }}>
                <button
                  type="button"
                  className="btn"
                  onClick={handleShowParticipantsList}
                >
                  Participants
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={handleShowParticipantsList}
                >
                  Offices
                </button>
              </div>
            )}

            {showParticipantsList && (
              <div className="participants-list">
                <table>
                  <thead>
                    <tr>
                      <th>Select</th>
                      <th>ID</th>
                      <th>Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participants.map((user) => (
                      <tr key={user.id}>
                        <td>
                          <input
                            type="checkbox"
                            id={`participant-${user.id}`}
                            value={user.name}
                            onChange={(e) => handleCheckboxChange(e, user.name)}
                          />
                        </td>
                        <td>{user.id}</td>
                        <td>{user.name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <textarea
            name="description"
            placeholder="Meeting Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <br />
          <button type="submit">Submit</button>
          <button type="button" onClick={onClose}>
            Close
          </button>
        </form>
      </div>
    </div>
  );
}

export default ScheduleMeeting;
