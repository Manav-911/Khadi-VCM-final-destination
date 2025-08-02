const db = require('../config/db');

// Get all meetings for calendar
const getAllMeetings = async (req, res) => {
  try {
    const { data, error } = await db
      .from('meetings')
      .select(`
        id,
        title,
        description,
        start_time,
        duration_minutes,
        status,
        conference_room_id,
        want_room,
        link,
        conference_room (
          name
        ),
        users!meetings_requested_by_fkey (
          name,
          email
        )
      `)
      .order('start_time', { ascending: true });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Transform data to match FullCalendar format
    const formattedEvents = data.map(meeting => {
      // Calculate end time based on start_time + duration_minutes
      const startTime = new Date(meeting.start_time);
      const endTime = new Date(startTime.getTime() + (meeting.duration_minutes || 60) * 60000);

      return {
        id: meeting.id,
        title: meeting.title,
        start: meeting.start_time,
        end: endTime.toISOString(),
        extendedProps: {
          description: meeting.description,
          status: meeting.status,
          duration_minutes: meeting.duration_minutes,
          conference_room_id: meeting.conference_room_id,
          conference_room_name: meeting.conference_room?.name,
          requested_by_name: meeting.users?.name,
          requested_by_email: meeting.users?.email,
          want_room: meeting.want_room,
          link: meeting.link
        },
        // Color coding based on status
        backgroundColor: getStatusColor(meeting.status),
        borderColor: getStatusColor(meeting.status, true)
      };
    });

    res.json(formattedEvents);
  } catch (error) {
    console.error('Error fetching meetings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Helper function for status colors
const getStatusColor = (status, border = false) => {
  const colors = {
    pending: border ? '#f59e0b' : '#fbbf24',
    approved: border ? '#10b981' : '#34d399',
    rejected: border ? '#ef4444' : '#f87171',
    completed: border ? '#6b7280' : '#9ca3af'
  };
  return colors[status] || (border ? '#6b7280' : '#9ca3af');
};

// Get single meeting by ID
const getMeetingById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await db
      .from('meetings')
      .select(`
        *,
        conference_room (
          name
        ),
        users!meetings_requested_by_fkey (
          name,
          email
        ),
        meeting_participants (
          user_id,
          users (
            name,
            email
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    const startTime = new Date(data.start_time);
    const endTime = new Date(startTime.getTime() + (data.duration_minutes || 60) * 60000);

    const formattedMeeting = {
      id: data.id,
      title: data.title,
      start: data.start_time,
      end: endTime.toISOString(),
      extendedProps: {
        description: data.description,
        status: data.status,
        duration_minutes: data.duration_minutes,
        conference_room_id: data.conference_room_id,
        conference_room_name: data.conference_room?.name,
        requested_by: data.requested_by,
        requested_by_name: data.users?.name,
        requested_by_email: data.users?.email,
        want_room: data.want_room,
        link: data.link,
        participants: data.meeting_participants?.map(p => ({
          id: p.user_id,
          name: p.users?.name,
          email: p.users?.email
        })) || []
      }
    };

    res.json(formattedMeeting);
  } catch (error) {
    console.error('Error fetching meeting:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getAllMeetings,
  getMeetingById
};