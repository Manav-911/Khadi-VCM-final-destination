import React, { useState } from "react";
import Header from "../components/shared/Header";
import Footer from "../components/shared/Footer";
import CalendarView from "../components/calendar/CalendarView";
import RequestMeetingForm from "../components/meeting/RequestMeetingForm";
import "../styles/dashboard.css";

export default function Dashboard() {
    const [selectedView, setSelectedView] = useState("calendar");

    const renderTargetContent = () => {
        switch (selectedView) {
            case "calendar":
                return <CalendarView />;
            case "request":
                return <RequestMeetingForm />;
            default:
                return <p>Select an option from the sidebar.</p>;
        }
    };

    return (
        <div className="page-container">
            <Header />
            <main className="dashboard-main">
                <div className="dashboard-layout">
                    <div className="navbar">
                        <ul>
                            <li
                                className={selectedView === "calendar" ? "active" : ""}
                                onClick={() => setSelectedView("calendar")}
                            >
                                Calendar
                            </li>
                            <li
                                className={selectedView === "request" ? "active" : ""}
                                onClick={() => setSelectedView("request")}
                            >
                                Request Meeting
                            </li>
                        </ul>

                    </div>
                    <div className="target">{renderTargetContent()}</div>
                    <div className="scheduled-meetings">
                        <h3>Scheduled Meetings</h3>
                        <p>Coming soon: fetched meeting list</p>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
