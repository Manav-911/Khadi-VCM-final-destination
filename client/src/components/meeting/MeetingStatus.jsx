import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import RequestMeetingForm from "./RequestMeetingForm";
import "./meetingstatus.css";

// Use destructuring for clarity and to ensure userId is passed
export default function MeetingStatus({ userId }) { 
    const [meetings, setMeetings] = useState([]);
    const [editingMeeting, setEditingMeeting] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null); // Initialize as null/string
    const [search, setSearch] = useState("");
    const [selectedDate, setSelectedDate] = useState("");

    // Use useCallback to memoize the function, making it stable for useEffect dependency
    const fetchUserMeetings = useCallback(async () => {
        if (!userId) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            
            // CORRECTED: Use the prop 'userId' in the URL and the correct status endpoint
            const response = await axios.get(
                `http://localhost:3000/meeting/user/${userId}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                    withCredentials: true,
                }
            );

            const allUserMeetings = response.data;

            // FIX 1: Filter to show only FUTURE/CURRENT pending/approved meetings
            const now = new Date();
            const relevantMeetings = allUserMeetings.filter((m) => {
                const isNotConcluded = !m.end || new Date(m.end) > now;
                
                // Keep the original filter for 'pending' or 'approved'
                // This means 'denied' (rejected/cancelled) meetings will be EXCLUDED, 
                // which matches the original component's logic (only showing pending/approved).
                const statusIsRelevant =
                    m.status === "pending" || m.status === "approved"; 
                
                // If you wanted to show ALL pending/approved/denied:
                // const statusIsRelevant = true;

                return statusIsRelevant && isNotConcluded;
            });

            setMeetings(relevantMeetings);
        } catch (err) {
            console.error("Failed to fetch user meetings:", err);
            // FIX 2: Set error message and clear meetings on failure
            setError("Failed to fetch user meetings. Please try again.");
            setMeetings([]);
        } finally {
            setLoading(false);
        }
    }, [userId]); // Dependency array includes userId

    // Consolidate useEffect to run fetchUserMeetings when userId is available
    useEffect(() => {
        fetchUserMeetings();
    }, [fetchUserMeetings]); // Now depends on the stable fetchUserMeetings function

    // Filter meetings by search and date
    const filteredMeetings = meetings.filter((m) => {
        const titleMatch =
            search === "" || m.title?.toLowerCase().includes(search.toLowerCase());

        const dateMatch =
            !selectedDate || (m.start && m.start.split("T")[0] === selectedDate);

        return titleMatch && dateMatch;
    });

    // Handle edit: open the form with meeting data
    const handleEdit = (meeting) => {
        setEditingMeeting(meeting);
    };

    // Handle submit: resend the request and discard previous one (Simplified logic)
    const handleEditSubmit = async (formData) => {
        // You should ideally have an UPDATE/PUT endpoint, but following your logic:
        try {
             // 1. Delete previous meeting
            await axios.delete(`http://localhost:3000/meeting/${editingMeeting.id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            
            // 2. Create new meeting request
            await axios.post("http://localhost:3000/meeting/request", formData, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            
            setEditingMeeting(null);
            // 3. Refresh meetings
            await fetchUserMeetings(); // Use the existing fetch function

        } catch(err) {
            console.error("Error submitting edit:", err);
            alert("Failed to resubmit meeting request.");
        }
    };

    if (loading) {
        return (
            <div className="ums-spinner">
                <div className="ums-loader"></div>
            </div>
        );
    }

    if (error) {
        return <div className="ums-error">{error}</div>; // Display dynamic error
    }

    // UPDATED: Helper function to get a status-specific class name, including 'denied'
    const getStatusClass = (status) => {
        switch (status) {
            case "approved":
                return "status-approved";
            case "pending":
                return "status-pending";
            case "denied": // Handle the aliased status from the backend
                return "status-denied"; 
            default:
                return "";
        }
    };

    return (
        <div className="ums-container">
            <h2 className="ums-title">My Meeting Status</h2>

            {/* ... Filters section remains the same ... */}
            <div className="ums-filters">
                <div className="ums-searchbar-wrap">
                    <input
                        className="ums-search"
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
                    className="ums-date-filter"
                />
            </div>
            {/* End Search + Date Filters */}

            <div className="ums-grid">
                {filteredMeetings.length > 0 ? (
                    filteredMeetings.map((meeting) => (
                        // Note: The original filter excludes 'denied' meetings, 
                        // so they won't appear here unless you change the filter logic above.
                        <div className="ums-card" key={meeting.id}>
                            <div className="ums-card-body">
                                <div className="ums-header">
                                    <div className="ums-card-title">{meeting.title}</div>
                                    {/* Use the aliased status for the class */}
                                    <span className={`ums-status ${getStatusClass(meeting.status)}`}>
                                        {meeting.status?.toUpperCase() || "PENDING"}
                                    </span>
                                </div>
                                <div className="ums-card-desc">
                                    {meeting.extendedProps?.description ||
                                        "No description available"}
                                </div>
                                <div className="ums-card-info">
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
                                {/* Action button: changes text based on status */}
                                <button 
                                    className={`ums-btn ums-btn-${meeting.status || 'pending'}`}
                                    onClick={() => (meeting.status === 'pending' ? handleEdit(meeting) : null)}
                                >
                                    {meeting.status === "approved"
                                        ? "View Details"
                                        : meeting.status === "denied"
                                          ? "Denied (View Details)"
                                          : "Edit / Cancel Request"}
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="ums-no-meetings">
                        No active meeting requests found.
                    </div>
                )}
            </div>

            {/* Edit Modal (remains the same) */}
            {editingMeeting && (
                <div className="edit-modal-overlay">
                    <div className="edit-modal">
                        <h4>Edit Meeting Request</h4>
                        <RequestMeetingForm
                            initialData={editingMeeting}
                            onSubmit={handleEditSubmit}
                            onCancel={() => setEditingMeeting(null)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}