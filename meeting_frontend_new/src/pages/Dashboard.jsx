import React, { useState } from 'react';
import Header from '../components/shared/Header';
import CalendarView from '../components/calendar/CalendarView';
import MeetingList from '../components/meetings/MeetingList';
import MeetingRequestForm from '../components/meetings/MeetingRequestForm';
import '../styles/dashboard.css';

export default function Dashboard() {
  const [activeView, setActiveView] = useState('calendar');

  const renderMainContent = () => {
    switch (activeView) {
      case 'requests':
        return <MeetingRequestForm />;
      case 'calendar':
      default:
        return (
          <>
            <div className="calendar-section">
              <CalendarView />
            </div>
            <div className="meetings-list-section">
              <h3>Today's Meetings</h3>
              <MeetingList />
            </div>
          </>
        );
    }
  };

  return (
    <div className="dashboard-container">
      <Header />
      <div className="dashboard-content">
        <div className="sidebar">
          <div className="sidebar-section">
            <h3>Meeting Actions</h3>
            <button
              className={`action-btn ${activeView === 'calendar' ? 'active' : ''}`}
              onClick={() => setActiveView('calendar')}
            >
              Calendar
            </button>
            <button
              className={`action-btn ${activeView === 'requests' ? 'active' : ''}`}
              onClick={() => setActiveView('requests')}
            >
              Request a Meeting
            </button>
          </div>
        </div>
        <div className="main-content">
          {renderMainContent()}
        </div>
      </div>
    </div>
  );
}
