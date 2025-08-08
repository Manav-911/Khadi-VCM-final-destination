import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../meeting/requestmeetingform.css";
import axios from 'axios';



export default function RequestMeetingForm() {

  const [formData, setFormData] = useState({
    title: "",
    date: null,
    startHour: "",
    startMinute: "",
    amPm: "",
    durationHours: "",
    durationMinutes: "",
    wantsConferenceRoom: false, // Added this line
    description: ""
  });

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

      let totalMinutes = hours % 12 * 60 + minutes + durationHrs * 60 + durationMins;
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
  }, [formData.startHour, formData.startMinute, formData.durationHours, formData.durationMinutes, formData.amPm]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Convert selected date and start time into a valid ISO string
    const date = formData.date;
    const hour = parseInt(formData.startHour);
    const minute = parseInt(formData.startMinute);
    const isPM = formData.amPm === "PM";

    if (!date || isNaN(hour) || isNaN(minute)) {
      alert("Please provide a valid date and start time.");
      return;
    }

    const startDateTime = new Date(date);
    startDateTime.setHours((hour % 12) + (isPM ? 12 : 0));
    startDateTime.setMinutes(minute);
    startDateTime.setSeconds(0);
    startDateTime.setMilliseconds(0);

    const formattedDateTime = startDateTime.toISOString(); // 👈🏽 Now it's defined

    try {
      await axios.post("http://localhost:5000/api/meetings", {
        title: formData.title,
        description: formData.description,
        start_time: formattedDateTime,
        duration_minutes:
          parseInt(formData.durationHours || 0) * 60 +
          parseInt(formData.durationMinutes || 0),
        want_room: formData.wantsConferenceRoom,
        status: "pending",
      });
      alert("Meeting request submitted!");
    } catch (err) {
      console.error(err);
      alert("Submission failed");
    }
  };




  return (
    <div className="meeting-form-container">
      <div className="form-wrapper">
        <h2 className="form-title">Request a Meeting</h2>
        <form className="request-form" onSubmit={handleSubmit}>

          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              placeholder="e.g. Design Review"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, startHour: e.target.value })}
                required
              />
              <span>:</span>
              <input
                type="number"
                placeholder="MM"
                min="0"
                max="59"
                value={formData.startMinute}
                onChange={(e) => setFormData({ ...formData, startMinute: e.target.value })}
                required
              />
              <select
                className="ampm-select"
                value={formData.amPm}
                onChange={(e) => setFormData({ ...formData, amPm: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, durationHours: e.target.value })}
                required
              />
              <span>:</span>
              <input
                type="number"
                placeholder="Mins"
                min="0"
                max="59"
                value={formData.durationMinutes}
                onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, wantsConferenceRoom: e.target.checked })}
                />
                <div className="custom-checkbox">
                  <svg className="checkmark" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20,6 9,17 4,12"></polyline>
                  </svg>
                </div>
                <span className="checkbox-text">Yes, I need a conference room</span>
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              placeholder="Add meeting agenda, notes, etc."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="3"
              required
            />
          </div>

          <button type="submit">Submit Request</button>

        </form>
      </div>
    </div>
  );
}