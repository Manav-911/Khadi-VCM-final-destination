import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import MeetingService from '../../services/eventService';

export default function CalendarView() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState({ id: 1 }); // Replace with your auth context

  // Fetch meetings from API
  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const meetingsData = await MeetingService.getAllMeetings();
      setMeetings(meetingsData);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch meetings:', err);
      setError('Failed to load meetings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
    // TODO: Get current user from your auth context/service
    // setCurrentUser(getCurrentUser());
  }, []);

  // Handle meeting creation (when user clicks on calendar)
  const handleDateSelect = async (selectInfo) => {
    const title = prompt('Enter meeting title:');
    if (!title || !title.trim()) {
      selectInfo.view.calendar.unselect();
      return;
    }

    const description = prompt('Enter meeting description (optional):') || '';
    const durationInput = prompt('Enter duration in minutes:', '60');
    const duration = parseInt(durationInput) || 60;
    const wantRoom = confirm('Do you need a conference room?');
    
    try {
      const startTime = new Date(selectInfo.start);
      const meetingData = {
        title: title.trim(),
        description,
        start_time: startTime.toISOString(),
        duration_minutes: duration,
        requested_by: currentUser?.id || 1,
        want_room: wantRoom,
        conference_room_id: null,
        link: null
      };

      // If they want a room, show available rooms
      if (wantRoom) {
        try {
          const availableRooms = await MeetingService.getAvailableRooms(
            startTime.toISOString(), 
            duration
          );
          
          if (availableRooms.length > 0) {
            const roomOptions = availableRooms.map(room => 
              `${room.id}: ${room.name}`
            ).join('\n');
            
            const selectedRoomId = prompt(
              `Available rooms:\n${roomOptions}\n\nEnter room ID (or leave blank for no room):`
            );
            
            if (selectedRoomId && !isNaN(selectedRoomId)) {
              meetingData.conference_room_id = parseInt(selectedRoomId);
            }
          } else {
            alert('No conference rooms available for this time slot.');
            meetingData.want_room = false;
          }
        } catch (roomError) {
          console.error('Error fetching available rooms:', roomError);
          alert('Could not check room availability. Meeting will be created without a room.');
          meetingData.want_room = false;
        }
      }

      const createdMeeting = await MeetingService.createMeeting(meetingData);
      setMeetings(prevMeetings => [...prevMeetings, createdMeeting]);
      
      // Clear selection
      selectInfo.view.calendar.unselect();
    } catch (err) {
      console.error('Failed to create meeting:', err);
      alert(`Failed to create meeting: ${err.message}`);
    }
  };

  // Handle meeting click (for editing/viewing)
  const handleEventClick = async (clickInfo) => {
    const meeting = clickInfo.event;
    const props = meeting.extendedProps;
    
    const meetingInfo = `
Meeting: ${meeting.title}
Description: ${props.description || 'No description'}
Start: ${meeting.start.toLocaleString()}
End: ${meeting.end.toLocaleString()}
Status: ${props.status || 'pending'}
Duration: ${props.duration_minutes || 60} minutes
Room: ${props.conference_room_name || 'No room assigned'}
Requested by: ${props.requested_by_name || 'Unknown'}
${props.link ? `Link: ${props.link}` : ''}
    `.trim();

    const action = prompt(
      `${meetingInfo}\n\nOptions:\n- Type "edit" to edit title\n- Type "delete" to delete\n- Type "status" to change status\n- Press Cancel to close`
    );

    if (action === 'edit') {
      await handleEditMeeting(meeting);
    } else if (action === 'delete') {
      await handleDeleteMeeting(meeting);
    } else if (action === 'status') {
      await handleStatusChange(meeting);
    }
  };

  const handleEditMeeting = async (meeting) => {
    const newTitle = prompt('Enter new title:', meeting.title);
    if (newTitle && newTitle.trim() !== meeting.title) {
      try {
        const updatedMeetingData = {
          title: newTitle.trim(),
          description: meeting.extendedProps.description || '',
          start_time: meeting.start.toISOString(),
          duration_minutes: meeting.extendedProps.duration_minutes || 60,
          status: meeting.extendedProps.status || 'pending',
          conference_room_id: meeting.extendedProps.conference_room_id || null,
          want_room: meeting.extendedProps.want_room || false,
          link: meeting.extendedProps.link || null
        };

        const updatedMeeting = await MeetingService.updateMeeting(meeting.id, updatedMeetingData);
        
        // Update local state
        setMeetings(prevMeetings => 
          prevMeetings.map(m => m.id === meeting.id ? updatedMeeting : m)
        );
      } catch (err) {
        console.error('Failed to update meeting:', err);
        alert(`Failed to update meeting: ${err.message}`);
      }
    }
  };

  const handleStatusChange = async (meeting) => {
    const newStatus = prompt(
      'Enter new status (pending/approved/rejected/completed):', 
      meeting.extendedProps.status || 'pending'
    );
    
    const validStatuses = ['pending', 'approved', 'rejected', 'completed'];
    if (newStatus && validStatuses.includes(newStatus.toLowerCase())) {
      try {
        const updatedMeetingData = {
          title: meeting.title,
          description: meeting.extendedProps.description || '',
          start_time: meeting.start.toISOString(),
          duration_minutes: meeting.extendedProps.duration_minutes || 60,
          status: newStatus.toLowerCase(),
          conference_room_id: meeting.extendedProps.conference_room_id || null,
          want_room: meeting.extendedProps.want_room || false,
          link: meeting.extendedProps.link || null
        };

        const updatedMeeting = await MeetingService.updateMeeting(meeting.id, updatedMeetingData);
        
        // Update local state
        setMeetings(prevMeetings => 
          prevMeetings.map(m => m.id === meeting.id ? updatedMeeting : m)
        );
      } catch (err) {
        console.error('Failed to update meeting status:', err);
        alert(`Failed to update meeting status: ${err.message}`);
      }
    }
  };

  const handleDeleteMeeting = async (meeting) => {
    if (window.confirm(`Are you sure you want to delete "${meeting.title}"?`)) {
      try {
        await MeetingService.deleteMeeting(meeting.id);
        
        // Remove from local state
        setMeetings(prevMeetings => prevMeetings.filter(m => m.id !== meeting.id));
      } catch (err) {
        console.error('Failed to delete meeting:', err);
        alert(`Failed to delete meeting: ${err.message}`);
      }
    }
  };

  // Handle meeting drag and drop
  const handleEventDrop = async (dropInfo) => {
    try {
      const meeting = dropInfo.event;
      const newStartTime = meeting.start;
      
      const updatedMeetingData = {
        title: meeting.title,
        description: meeting.extendedProps.description || '',
        start_time: newStartTime.toISOString(),
        duration_minutes: meeting.extendedProps.duration_minutes || 60,
        status: meeting.extendedProps.status || 'pending',
        conference_room_id: meeting.extendedProps.conference_room_id || null,
        want_room: meeting.extendedProps.want_room || false,
        link: meeting.extendedProps.link || null
      };

      const updatedMeeting = await MeetingService.updateMeeting(meeting.id, updatedMeetingData);
      
      // Update local state
      setMeetings(prevMeetings => 
        prevMeetings.map(m => m.id === meeting.id ? updatedMeeting : m)
      );
    } catch (err) {
      console.error('Failed to update meeting:', err);
      alert(`Failed to update meeting: ${err.message}`);
      // Revert the event
      dropInfo.revert();
    }
  };

  if (loading) {
    return <div className="calendar-loading">Loading meetings...</div>;
  }

  if (error) {
    return (
      <div className="calendar-error">
        <p>{error}</p>
        <button onClick={fetchMeetings}>Retry</button>
      </div>
    );
  }

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <h2>Meeting Calendar</h2>
        <div className="calendar-legend">
          <div className="legend-item">
            <div className="legend-color pending"></div>
            <span>Pending</span>
          </div>
          <div className="legend-item">
            <div className="legend-color approved"></div>
            <span>Approved</span>
          </div>
          <div className="legend-item">
            <div className="legend-color rejected"></div>
            <span>Rejected</span>
          </div>
          <div className="legend-item">
            <div className="legend-color completed"></div>
            <span>Completed</span>
          </div>
        </div>
      </div>

      <div className="calendar-instructions">
        💡 Click and drag to select time slots for new meetings • Click existing meetings to view/edit • Drag meetings to reschedule
      </div>

      <FullCalendar
        plugins={[timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        events={meetings}
        height="auto"
        slotMinTime="07:00:00"
        slotMaxTime="18:00:00"
        allDaySlot={false}
        nowIndicator={true}
        editable={true}
        selectable={true}
        select={handleDateSelect}
        eventClick={handleEventClick}
        eventDrop={handleEventDrop}
        eventDidMount={(info) => {
          const desc = info.event.extendedProps.description;
          if (desc) {
            info.el.setAttribute('title', desc);
          }
        }}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'timeGridWeek,timeGridDay'
        }}
        slotDuration="00:30:00"
        slotLabelInterval="01:00:00"
        eventOverlap={false}
        slotEventOverlap={false}
        businessHours={{
          daysOfWeek: [1, 2, 3, 4, 5], // Monday - Friday
          startTime: '09:00',
          endTime: '17:00'
        }}
      />
    </div>
  );
}