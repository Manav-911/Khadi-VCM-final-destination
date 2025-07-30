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

// Create new meeting
const createMeeting = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      start_time, 
      duration_minutes = 60,
      requested_by,
      conference_room_id,
      want_room = false,
      link,
      participants = []
    } = req.body;

    // Insert meeting
    const { data: meetingData, error: meetingError } = await db
      .from('meetings')
      .insert([
        {
          title,
          description,
          start_time,
          duration_minutes,
          requested_by,
          conference_room_id,
          want_room,
          link,
          status: 'pending'
        }
      ])
      .select()
      .single();

    if (meetingError) {
      return res.status(400).json({ error: meetingError.message });
    }

    // Add participants if provided
    if (participants.length > 0) {
      const participantInserts = participants.map(userId => ({
        meeting_id: meetingData.id,
        user_id: userId
      }));

      const { error: participantError } = await db
        .from('meeting_participants')
        .insert(participantInserts);

      if (participantError) {
        console.error('Error adding participants:', participantError);
      }
    }

    // Return formatted meeting
    const endTime = new Date(new Date(meetingData.start_time).getTime() + duration_minutes * 60000);

    const formattedMeeting = {
      id: meetingData.id,
      title: meetingData.title,
      start: meetingData.start_time,
      end: endTime.toISOString(),
      extendedProps: {
        description: meetingData.description,
        status: meetingData.status,
        duration_minutes: meetingData.duration_minutes,
        conference_room_id: meetingData.conference_room_id,
        want_room: meetingData.want_room,
        link: meetingData.link
      }
    };

    res.status(201).json(formattedMeeting);
  } catch (error) {
    console.error('Error creating meeting:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update meeting
const updateMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, 
      description, 
      start_time, 
      duration_minutes,
      status,
      conference_room_id,
      want_room,
      link
    } = req.body;

    const { data, error } = await db
      .from('meetings')
      .update({
        title,
        description,
        start_time,
        duration_minutes,
        status,
        conference_room_id,
        want_room,
        link
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const endTime = new Date(new Date(data.start_time).getTime() + (data.duration_minutes || 60) * 60000);

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
        want_room: data.want_room,
        link: data.link
      }
    };

    res.json(formattedMeeting);
  } catch (error) {
    console.error('Error updating meeting:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete meeting
const deleteMeeting = async (req, res) => {
  try {
    const { id } = req.params;

    // Delete participants first (due to foreign key constraint)
    await db
      .from('meeting_participants')
      .delete()
      .eq('meeting_id', id);

    // Then delete the meeting
    const { error } = await db
      .from('meetings')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Meeting deleted successfully' });
  } catch (error) {
    console.error('Error deleting meeting:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get available conference rooms for a time slot
const getAvailableRooms = async (req, res) => {
  try {
    const { start_time, duration_minutes = 60, office_id } = req.query;

    if (!start_time) {
      return res.status(400).json({ error: 'start_time is required' });
    }

    const endTime = new Date(new Date(start_time).getTime() + duration_minutes * 60000);

    // Get all rooms for the office
    let roomQuery = db.from('conference_room').select('*');
    
    if (office_id) {
      roomQuery = roomQuery.eq('office_id', office_id);
    }

    const { data: allRooms, error: roomError } = await roomQuery;

    if (roomError) {
      return res.status(400).json({ error: roomError.message });
    }

    // Get conflicting meetings
    const { data: conflictingMeetings, error: meetingError } = await db
      .from('meetings')
      .select('conference_room_id, start_time, duration_minutes')
      .not('conference_room_id', 'is', null)
      .in('status', ['pending', 'approved']);

    if (meetingError) {
      return res.status(400).json({ error: meetingError.message });
    }

    // Filter available rooms
    const availableRooms = allRooms.filter(room => {
      if (!room.available) return false;

      const hasConflict = conflictingMeetings.some(meeting => {
        if (meeting.conference_room_id !== room.id) return false;

        const meetingStart = new Date(meeting.start_time);
        const meetingEnd = new Date(meetingStart.getTime() + (meeting.duration_minutes || 60) * 60000);
        const requestStart = new Date(start_time);
        const requestEnd = endTime;

        return (requestStart < meetingEnd && requestEnd > meetingStart);
      });

      return !hasConflict;
    });

    res.json(availableRooms);
  } catch (error) {
    console.error('Error fetching available rooms:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getAllMeetings,
  getMeetingById,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  getAvailableRooms
};