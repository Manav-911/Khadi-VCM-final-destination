import React, { useState } from 'react';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../../styles/calendar.css'

const localizer = momentLocalizer(moment);

const events = [
  {
    title: 'Product Strategy Review',
    start: new Date(2025, 4, 13, 10, 0),
    end: new Date(2025, 4, 13, 11, 30),
    participants: ['John', 'Jane', 'Raj'],
  },
  {
    title: 'Marketing Sync',
    start: new Date(2025, 4, 13, 14, 0),
    end: new Date(2025, 4, 13, 15, 0),
    participants: ['Team Leads'],
  },
];

// ✅ Custom Toolbar
const CustomToolbar = (toolbar) => {
  const goToBack = () => toolbar.onNavigate('PREV');
  const goToNext = () => toolbar.onNavigate('NEXT');
  const goToToday = () => toolbar.onNavigate('TODAY');
  const setView = (view) => toolbar.onView(view);

  return (
    <div className="custom-toolbar">
      <div className="left">
        <button onClick={goToToday}>Today</button>
        <button onClick={goToBack}>Back</button>
        <button onClick={goToNext}>Next</button>
      </div>
      <div className="center">{toolbar.label}</div>
      <div className="right">
        <button
          className={toolbar.view === 'month' ? 'rbc-active' : ''}
          onClick={() => setView('month')}
        >
          Month
        </button>
        <button
          className={toolbar.view === 'week' ? 'rbc-active' : ''}
          onClick={() => setView('week')}
        >
          Week
        </button>
        <button
          className={toolbar.view === 'day' ? 'rbc-active' : ''}
          onClick={() => setView('day')}
        >
          Day
        </button>
        <button
          className={toolbar.view === 'agenda' ? 'rbc-active' : ''}
          onClick={() => setView('agenda')}
        >
          Agenda
        </button>
      </div>
    </div>
  );
};


const MeetingCalendar = () => {
  const [view, setView] = useState(Views.MONTH);
  const [date, setDate] = useState(new Date());

  return (
    <div className="conference-calendar">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        views={['month', 'week', 'day', 'agenda']}
        view={view}
        onView={setView}
        date={date}
        onNavigate={setDate}
        components={{
          toolbar: CustomToolbar,
        }}
        style={{ height: '100%', width: '100%' }}
      />
    </div>
  );
};

export default MeetingCalendar;
