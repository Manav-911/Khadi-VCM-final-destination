const supabase = require("../config/db.js");

// Check if any license is already booked at the requested time
async function checkLicense(newStartTime, endTime) {
  try {
    const { data: meetings, error } = await supabase
      .from("meetings")
      .select("start_time, duration_minutes")
      .eq("status", "approved");

    if (error) {
      console.error("Supabase Error: ", error);
      return true; // Assume license is busy in error case
    }

    const isOverlapping = meetings.some((meeting) => {
      const meetingStart = new Date(meeting.start_time);
      const meetingEnd = new Date(
        meetingStart.getTime() + meeting.duration_minutes * 60000
      );
      return !(meetingEnd <= newStartTime || meetingStart >= endTime);
    });

    return isOverlapping;
  } catch (error) {
    console.error("ERROR in license check: ", error);
    return true; // Assume busy on failure
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

  const { title, description, start_time, duration, want_room, participants } =
    req.body;

  const newStartTime = new Date(start_time);
  const endTime = new Date(newStartTime.getTime() + duration * 60000);

  const licenseBusy = await checkLicense(newStartTime, endTime);
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
        duration_minutes: duration,
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

  // 2. Add participants
  const participantIds = participants
    .split(",")
    .map((id) => parseInt(id.trim()))
    .filter((id) => !isNaN(id));

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

module.exports = { addMeeting, checkLicense, checkRoom };
