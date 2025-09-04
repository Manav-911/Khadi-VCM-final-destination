const supabase = require("../config/db.js");

async function checkLicense(officeId, newStartTime, endTime) {
  try {
    // 1. Fetch all licenses for this office
    const { data: officeLicenses, error: licenseError } = await supabase
      .from("licenses")
      .select("id")
      .eq("office_id", officeId); // requires licenses.office_id column

    if (licenseError) {
      console.error("Error fetching office licenses:", licenseError);
      return true; // treat as busy
    }

    if (!officeLicenses || officeLicenses.length === 0) {
      console.warn("No licenses found for this office:", officeId);
      return true; // no license = cannot schedule
    }

    const licenseIds = officeLicenses.map((l) => l.id);

    // 2. Fetch meetings that are approved and tied to those licenses
    const { data: meetings, error: meetingError } = await supabase
      .from("meetings")
      .select("license, start_time, duration_minutes")
      .eq("status", "approved")
      .in("license", licenseIds);

    if (meetingError) {
      console.error("Error fetching meetings:", meetingError);
      return true;
    }

    // 3. Check for overlap
    const isOverlapping = meetings.some((meeting) => {
      const meetingStart = new Date(meeting.start_time);
      const meetingEnd = new Date(
        meetingStart.getTime() + meeting.duration_minutes * 60000
      );
      return !(meetingEnd <= newStartTime || meetingStart >= endTime);
    });

    return isOverlapping;
  } catch (error) {
    console.error("ERROR in checkLicense:", error);
    return true;
  }
}

// Check if any room is available in the requested time slot
async function checkRoom(officeId, newStartTime, endTime) {
  try {
    const { data: rooms, error: roomError } = await supabase
      .from("conference_room")
      .select("id")
      .eq("office_id", officeId);

    if (roomError || !rooms) {
      console.error("Error fetching rooms: ", roomError);
      return false;
    }

    const roomIds = rooms.map((room) => room.id);
    if (roomIds.length === 0) return false;

    const { data: meetings, error: meetingError } = await supabase
      .from("meetings")
      .select("conference_room_id, start_time, duration_minutes")
      .eq("status", "approved")
      .in("conference_room_id", roomIds);

    if (meetingError || !meetings) {
      console.error("Error fetching meetings: ", meetingError);
      return false;
    }

    const busyRoomIds = new Set();

    meetings.forEach((meeting) => {
      const start = new Date(meeting.start_time);
      const end = new Date(start.getTime() + meeting.duration_minutes * 60000);
      const isOverlap = !(end <= newStartTime || start >= endTime);

      if (isOverlap) {
        busyRoomIds.add(meeting.conference_room_id);
      }
    });

    const availableRoomId = roomIds.find((id) => !busyRoomIds.has(id));
    return !!availableRoomId; // Return true if found, false otherwise
  } catch (error) {
    console.error("ERROR in checkRoom: ", error);
    return false;
  }
}

// Handle the meeting request
const addMeeting = async (req, res) => {
  const userId = req.user.userId;
  const officeId = req.user.officeId;

  console.log(typeof officeId);

  const {
    title,
    description,
    start_time,
    duration_minutes,
    want_room,
    participants,
  } = req.body;

  const newStartTime = new Date(start_time);
  const endTime = new Date(newStartTime.getTime() + duration_minutes * 60000);

  const licenseBusy = await checkLicense(officeId, newStartTime, endTime);
  if (licenseBusy) {
    return res.status(400).json({
      success: false,
      message: "❌ No Webex license available at selected time.",
    });
  }

  if (want_room) {
    const roomAvailable = await checkRoom(officeId, newStartTime, endTime);
    if (!roomAvailable) {
      return res.status(400).json({
        success: false,
        message: "❌ No conference room available in that time slot.",
      });
    }
  }

  // If all checks passed, save request in pending state
  // 1. Insert the meeting request
  const { data: insertedMeeting, error: insertError } = await supabase
    .from("meetings")
    .insert([
      {
        title,
        description,
        start_time: newStartTime,
        duration_minutes: duration_minutes,
        requested_by: userId,
        status: "pending", // initially pending
        conference_room_id: null, // assigned later by admin
        license: null, // assigned later by admin
        link: null, // link generated later
        want_room,
      },
    ])
    .select()
    .single();

  const meetingId = insertedMeeting.id;

  let participantIds = [];

  if (Array.isArray(participants)) {
    participantIds = participants
      .map((id) => Number(id))
      .filter((id) => !isNaN(id));
  }

  const participantRows = participantIds.map((user_id) => ({
    meeting_id: meetingId,
    user_id,
  }));

  const { error: participantError } = await supabase
    .from("meeting_participants")
    .insert(participantRows);

  if (participantError) {
    console.error("Error inserting participants:", participantError);
    return res.status(500).json({
      success: false,
      message: "Meeting saved but failed to assign participants",
    });
  }

  return res.status(200).json({
    success: true,
    message: "✅ Meeting request submitted and pending approval.",
  });
};

// Get all meetings for calendar
const getApprovedMeetingUser = async (req, res) => {
  const userId = req.user.userId;
  const officeId = req.user.officeId;
  try {
    const { data, error } = await supabase
      .from("meetings")
      .select(
        `
      id,
      title,
      description,
      start_time,
      duration_minutes,
      status,
      want_room,
      link,
      conference_room:conference_room_id (
        id,
        name,
        office_id
      ),
      users!meetings_requested_by_fkey (
        name,
        email,
        office
      )
    `
      )
      .eq("status", "approved")
      .eq("users.office", officeId) // ✅ filter by requester’s office
      .order("start_time", { ascending: true });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Transform data to match FullCalendar format
    const formattedEvents = data.map((meeting) => {
      // Calculate end time based on start_time + duration_minutes
      const startTime = new Date(meeting.start_time);
      const endTime = new Date(
        startTime.getTime() + (meeting.duration_minutes || 60) * 60000
      );

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
          link: meeting.link,
        },
        // Color coding based on status
        backgroundColor: getStatusColor(meeting.status),
        borderColor: getStatusColor(meeting.status, true),
      };
    });

    res.json(formattedEvents);
  } catch (error) {
    console.error("Error fetching meetings:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Helper function for status colors
const getStatusColor = (status, border = false) => {
  const colors = {
    pending: border ? "#f59e0b" : "#fbbf24",
    approved: border ? "#10b981" : "#34d399",
    rejected: border ? "#ef4444" : "#f87171",
    completed: border ? "#6b7280" : "#9ca3af",
  };
  return colors[status] || (border ? "#6b7280" : "#9ca3af");
};

const getOffices = async (req, res) => {
  try {
    const { data, error } = await supabase.from("offices").select("*");

    if (error) throw error;

    res.status(200).json(data);
  } catch (err) {
    console.error("Error fetching offices:", err.message);
    res.status(500).json({ error: "Failed to fetch offices" });
  }
};

const getUsersByOffice = async (req, res) => {
  try {
    const { office } = req.params;

    if (!office) {
      return res.status(400).json({ error: "Office ID is required" });
    }

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("office", parseInt(office));

    if (error) throw error;

    res.status(200).json(data);
  } catch (err) {
    console.error("Error fetching users:", err.message);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

module.exports = {
  addMeeting,
  checkLicense,
  checkRoom,
  getApprovedMeetingUser,
  getOffices,
  getUsersByOffice,
};
