import React, { useState } from 'react';
import MeetingRequestForm from './MeetingRequestForm';
import '../../styles/meetings.css';

export default function MeetingRequestPanel() {
  const [activeTab, setActiveTab] = useState('request');

  return (
    <div className="request-panel">
      <div className="panel-tabs">
        <button
          className={activeTab === 'request' ? 'active' : ''}
          onClick={() => setActiveTab('request')}
        >
          Request Meeting
        </button>
        <button
          className={activeTab === 'cancel' ? 'active' : ''}
          onClick={() => setActiveTab('cancel')}
        >
          Cancel Meeting
        </button>
      </div>

      <div className="panel-content">
        {activeTab === 'request' ? (
          <MeetingRequestForm />
        ) : (
          <div>Cancellation Form Coming Soon</div>
        )}
      </div>
    </div>
  );
}
