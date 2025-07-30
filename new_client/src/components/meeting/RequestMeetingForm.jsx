import React, { useState } from "react";

export default function RequestMeetingForm() {
    const [formData, setFormData] = useState({
        title: '',
        date: '',
        startTime: '',
        endTime: '',
        description: '' // ← add this
    });


    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };


    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Meeting Request Data:", formData);
        // Future: Send to backend
    };

    return (
        <div className="form-wrapper">
            <h2 className="form-title">Request a Meeting</h2>
            <form className="request-form" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Title</label>
                    <input
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="e.g. Design Review"
                        required
                    />
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Date</label>
                        <input
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Time</label>
                        <input
                            type="time"
                            name="time"
                            value={formData.time}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="description">Description</label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Add meeting agenda, notes, etc."
                        rows="4"
                        required
                    />
                </div>

                <button type="submit">Submit Request</button>
            </form>
        </div>
    );
}
