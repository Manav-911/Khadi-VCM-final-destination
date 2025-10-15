import React from "react";
import { Outlet, NavLink } from "react-router-dom";
import Header from "../components/shared/Header";
import Footer from "../components/shared/Footer";
import ScheduledMeetings from "../components/scheduled/ScheduledMeetings";
import PreviousMeeting from "../components/meeting/PreviousMeeting"; // import the component
import "../styles/dashboard.css";

export default function Dashboard() {
  return (
    <div className="page-container">
      <Header />
      <main className="dashboard-main">
        <div className="dashboard-layout">
          <nav className="navbar">
            <ul>
              <li>
                <NavLink
                  to="/dashboard"
                  end
                  className={({ isActive }) => (isActive ? "active" : "")}
                >
                  Calendar
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/dashboard/request"
                  className={({ isActive }) => (isActive ? "active" : "")}
                >
                  Request Meeting
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/dashboard/previous"
                  className={({ isActive }) => (isActive ? "active" : "")}
                >
                  Previous Meetings
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/dashboard/stat"
                  className={({ isActive }) => (isActive ? "active" : "")}
                >
                  Meeting Status
                </NavLink>
              </li>
            </ul>
          </nav>

          <div className="scrollable-content">
            <section className="target">
              <Outlet />
            </section>
            <ScheduledMeetings />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
