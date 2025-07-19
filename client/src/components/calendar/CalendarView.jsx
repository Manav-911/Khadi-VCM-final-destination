import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';




export default function CalendarView() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    // Hardcoded demo meetings — replace with API call later
    const mockEvents = [
      {
        title: 'Design Review',
        start: '2025-07-14T10:00:00',
        end: '2025-07-14T11:00:00',
        extendedProps: {
          description: "Discuss UI Fixes"
        }
      },
      {
        title: 'Client Meeting',
        start: '2025-07-17T14:30:00',
        end: '2025-07-17T15:30:00',
      },
    ];
    setEvents(mockEvents);
  }, []);

  return (
    <div style={{ width: '100%', padding: '20px' }}>
      <FullCalendar
        plugins={[timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        events={events}
        height="auto"
        eventDidMount={(info) => {
          const desc = info.event.extendedProps.description;
          if(desc){
            info.el.setAttribute('title',desc);
          }
        }}
        slotMinTime="07:00:00"
        slotMaxTime="1800:00:00"
        allDaySlot={false}
        nowIndicator={true}
      />
    </div>
  );
}

