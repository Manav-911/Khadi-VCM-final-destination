import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "../calendar/calendarview.css";
import "react-datepicker/dist/react-datepicker.css";
import { useMeetingContext } from "../../context/MeetingContext.jsx";
import ParticipantSelector from "./ParticipantSelector";
import "../meeting/requestmeetingform.css";

export default function RequestMeetingForm({ open, onClose }) {
  const [formData, setFormData] = useState({
    title: "",
    date: null,
    startHour: "",
    startMinute: "",
    amPm: "AM",
    durationHours: "",
    durationMinutes: "",
    wantsConferenceRoom: false,
    description: "",
    participants: { individuals: [], offices: [] },
  });

  const [showSelector, setShowSelector] = useState(false);
  const { triggerRefresh } = useMeetingContext();
  const [endTime, setEndTime] = useState("");

  useEffect(() => {
    if (
      formData.startHour &&
      formData.startMinute !== "" &&
      formData.durationHours !== "" &&
      formData.durationMinutes !== ""
    ) {
      const hours = parseInt(formData.startHour);
      const minutes = parseInt(formData.startMinute);
      const durationHrs = parseInt(formData.durationHours);
      const durationMins = parseInt(formData.durationMinutes);

      let totalMinutes =
        (hours % 12) * 60 + minutes + durationHrs * 60 + durationMins;
      if (formData.amPm === "PM") totalMinutes += 12 * 60;

      const endHours24 = Math.floor(totalMinutes / 60) % 24;
      const endMins = totalMinutes % 60;
      const ampm = endHours24 >= 12 ? "PM" : "AM";
      const displayHour = endHours24 % 12 || 12;
      const displayMins = endMins.toString().padStart(2, "0");
      setEndTime(`${displayHour}:${displayMins} ${ampm}`);
    } else {
      setEndTime("");
    }
  }, [
    formData.startHour,
    formData.startMinute,
    formData.durationHours,
    formData.durationMinutes,
    formData.amPm,
  ]);

  const pad = (n) => n.toString().padStart(2, "0");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const date = formData.date;
    const hour = parseInt(formData.startHour);
    const minute = parseInt(formData.startMinute);
    const isPM = formData.amPm === "PM";

    if (!date || isNaN(hour) || isNaN(minute)) {
      alert("Please provide a valid date and start time.");
      return;
    }

    const startDateTime = new Date(date);
    const hour24 = (hour % 12) + (isPM && hour !== 12 ? 12 : 0);
    startDateTime.setHours(hour24);
    startDateTime.setMinutes(minute);
    startDateTime.setSeconds(0);
    startDateTime.setMilliseconds(0);

    const formattedDateTime = `${startDateTime.getFullYear()}-${pad(
      startDateTime.getMonth() + 1
    )}-${pad(startDateTime.getDate())}T${pad(startDateTime.getHours())}:${pad(
      startDateTime.getMinutes()
    )}:${pad(startDateTime.getSeconds())}`;

    const payload = {
      title: formData.title,
      description: formData.description,
      start_time: formattedDateTime,
      duration_minutes:
        parseInt(formData.durationHours || 0) * 60 +
        parseInt(formData.durationMinutes || 0),
      want_room: formData.wantsConferenceRoom,
      status: "pending",
      participants: formData.participants,
    };

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:3000/meeting/requestMeeting",
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      alert("Meeting request submitted!");
      triggerRefresh();

      // Reset form and close modal
      setFormData({
        title: "",
        date: null,
        startHour: "",
        startMinute: "",
        amPm: "AM",
        durationHours: "",
        durationMinutes: "",
        wantsConferenceRoom: false,
        description: "",
        participants: { individuals: [], offices: [] },
      });
      onClose();
    } catch (err) {
      console.error("Submission error:", err.response?.data || err.message);
      alert("Submission failed");
    }
  };

  // Return null if modal is not open - MOVED AFTER ALL HOOKS
  if (!open) return null;

  return (
    <div className="meeting-form-container">
      <div className="form-wrapper">
        <div className="form-header">
          <h2 className="form-title">Request a Meeting</h2>
          <button type="button" className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        <form className="request-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              placeholder="e.g. Design Review"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
            />
          </div>

          <div className="form-group">
            <label>Date</label>
            <DatePicker
              selected={formData.date}
              onChange={(date) => setFormData({ ...formData, date })}
              className="datepicker-input"
              placeholderText="Select a date"
              required
            />
          </div>

          <div className="form-group">
            <label>Start Time</label>
            <div className="time-fields">
              <input
                type="number"
                placeholder="HH"
                min="1"
                max="12"
                value={formData.startHour}
                onChange={(e) =>
                  setFormData({ ...formData, startHour: e.target.value })
                }
                required
              />
              <span>:</span>
              <input
                type="number"
                placeholder="MM"
                min="0"
                max="59"
                value={formData.startMinute}
                onChange={(e) =>
                  setFormData({ ...formData, startMinute: e.target.value })
                }
                required
              />
              <select
                className="ampm-select"
                value={formData.amPm}
                onChange={(e) =>
                  setFormData({ ...formData, amPm: e.target.value })
                }
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Duration (hrs & mins)</label>
            <div className="duration-fields">
              <input
                type="number"
                placeholder="Hrs"
                min="0"
                value={formData.durationHours}
                onChange={(e) =>
                  setFormData({ ...formData, durationHours: e.target.value })
                }
                required
              />
              <span>:</span>
              <input
                type="number"
                placeholder="Mins"
                min="0"
                max="59"
                value={formData.durationMinutes}
                onChange={(e) =>
                  setFormData({ ...formData, durationMinutes: e.target.value })
                }
                required
              />
              {endTime && (
                <div className="end-time-info">
                  Meeting will end at: <strong>{endTime}</strong>
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label>Want A Conference Room?</label>
            <div className="checkbox-container">
              <label className="custom-checkbox-label">
                <input
                  type="checkbox"
                  className="hidden-checkbox"
                  checked={formData.wantsConferenceRoom}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      wantsConferenceRoom: e.target.checked,
                    })
                  }
                />
                <div className="custom-checkbox">
                  <svg
                    className="checkmark"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <polyline points="20,6 9,17 4,12"></polyline>
                  </svg>
                </div>
                <span className="checkbox-text">
                  Yes, I need a conference room
                </span>
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              placeholder="Add meeting agenda, notes, etc."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows="3"
              required
            />
          </div>

          <div className="form-group">
            <label>Participants</label>
            <button
              type="button"
              className="add-participant-btn"
              onClick={() => setShowSelector(true)}
            >
              Select Participants
            </button>
            <div className="participants-list">
              <span className="participants-label">Individuals:</span>{" "}
              {formData.participants.individuals.length > 0
                ? formData.participants.individuals.join(", ")
                : "N/A"}
              <br />
              <span className="participants-label">Offices:</span>{" "}
              {formData.participants.offices.length > 0
                ? formData.participants.offices.join(", ")
                : "N/A"}
            </div>
          </div>

          <button type="submit">Submit Request</button>
        </form>
      </div>
      <ParticipantSelector
        show={showSelector}
        onClose={() => setShowSelector(false)}
        onSelect={(selected) =>
          setFormData((prev) => ({
            ...prev,
            participants: selected,
          }))
        }
        selected={formData.participants}
      />
    </div>
  );
}
