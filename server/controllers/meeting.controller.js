const supabase = require("../config/db.js");
const { get } = require("../routes/auth.Router.js");
const pool = require("../config/new_db.js");

async function checkLicense(officeId, newStartTime, endTime) {
  try {
    // 1. Fetch all licenses for this office
    const licenseRes = await pool.query(
      "SELECT id FROM licenses WHERE office_id = $1",
      [officeId]
    );
    const officeLicenses = licenseRes.rows;

    if (!officeLicenses || officeLicenses.length === 0) {
      console.warn("No licenses found for this office:", officeId);
      return true; // no license = cannot schedule
    }

    const licenseCount = officeLicenses.length;
    const licenseIds = officeLicenses.map((l) => l.id);

    // 2. Fetch approved meetings tied to those licenses
    const meetingRes = await pool.query(
      `SELECT license, start_time, duration_minutes
   FROM meetings
   WHERE status = 'approved' AND license = ANY($1::int[])`,
      [licenseIds]
    );
    const meetings = meetingRes.rows;

    let overlapCount = 0;

    // Convert once
    const reqStart = new Date(newStartTime).getTime();
    const reqEnd = new Date(endTime).getTime();

    console.log("Request Window:", reqStart, "->", reqEnd);

    meetings.forEach((meeting, idx) => {
      const meetingStart = new Date(meeting.start_time).getTime();
      const meetingEnd =
        meetingStart + (meeting.duration_minutes || 60) * 60000;

      const isOverlap = !(meetingEnd <= reqStart || meetingStart >= reqEnd);

      console.log(
        `Meeting ${idx + 1}:`,
        meeting.start_time,
        "->",
        new Date(meetingEnd).toISOString(),
        "| Overlap:",
        isOverlap
      );

      if (isOverlap) overlapCount++;
    });

    console.log(
      `Office ${officeId} - Overlapping licenses: ${overlapCount}/${licenseCount}`
    );

    return overlapCount >= licenseCount;
  } catch (error) {
    console.error("ERROR in checkLicense:", error);
    return true;
  }
}

// Check if any room is available in the requested time slot
async function checkRoom(officeId, newStartTime, endTime) {
  try {
    // 1. Fetch all rooms for this office
    const roomRes = await pool.query(
      "SELECT id FROM conference_room WHERE office_id = $1",
      [officeId]
    );
    const rooms = roomRes.rows;

    if (!rooms || rooms.length === 0) {
      console.warn("No rooms found for this office:", officeId);
      return false;
    }

    const roomIds = rooms.map((room) => room.id);

    // 2. Fetch approved meetings in these rooms
    const meetingRes = await pool.query(
      `SELECT conference_room_id, start_time, duration_minutes
   FROM meetings
   WHERE status = 'approved' AND conference_room_id = ANY($1::int[])`,
      [roomIds]
    );
    const meetings = meetingRes.rows;

    // 3. Track how many rooms are busy in that slot
    const busyRooms = new Set();

    meetings.forEach((meeting) => {
      const meetingStart = new Date(meeting.start_time);
      const meetingEnd = new Date(
        meetingStart.getTime() + meeting.duration_minutes * 60000
      );

      const isOverlap = !(
        meetingEnd <= newStartTime || meetingStart >= endTime
      );
      if (isOverlap) {
        busyRooms.add(meeting.conference_room_id);
      }
    });

    // 4. If busyRooms < total rooms → at least 1 free room
    return busyRooms.size < roomIds.length;
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
  console.log(newStartTime);

  const endTime = new Date(newStartTime.getTime() + duration_minutes * 60000);
  console.log(endTime);

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
  const insertRes = await pool.query(
    `INSERT INTO meetings
   (title, description, start_time, duration_minutes, requested_by, status, conference_room_id, license, link, want_room)
   VALUES ($1, $2, $3, $4, $5, 'pending', NULL, NULL, NULL, $6)
   RETURNING *`,
    [title, description, start_time, duration_minutes, userId, want_room]
  );

  const insertedMeeting = insertRes.rows[0];

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

  if (participantRows.length > 0) {
    const values = participantRows
      .map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`)
      .join(",");
    const flat = participantRows.flatMap((p) => [p.meeting_id, p.user_id]);

    await pool.query(
      `INSERT INTO meeting_participants (meeting_id, user_id) VALUES ${values}`,
      flat
    );
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
    const result = await pool.query(
      `SELECT m.id, m.title, m.description, m.start_time, m.duration_minutes, m.status, 
          m.want_room, m.link, m.conference_room_id,
          cr.name AS conference_room_name,
          u.name AS requested_by_name, u.email AS requested_by_email
   FROM meetings m
   LEFT JOIN conference_room cr ON m.conference_room_id = cr.id
   LEFT JOIN users u ON m.requested_by = u.id
   WHERE m.status = 'approved' AND u.office = $1
   ORDER BY m.start_time ASC`,
      [officeId]
    );

    const data = result.rows;

    // Transform data to match FullCalendar format
    const formattedEvents = data.map((meeting) => {
      let startTime;
      if (meeting.start_time instanceof Date) {
        startTime = meeting.start_time;
      } else {
        startTime = new Date(
          meeting.start_time.includes("T")
            ? meeting.start_time
            : meeting.start_time.replace(" ", "T")
        );
      }

      const endTime = new Date(
        startTime.getTime() + (meeting.duration_minutes || 60) * 60000
      );

      // Format without Z (local time)
      const formatLocal = (d) => d.toISOString().slice(0, 19); // "YYYY-MM-DDTHH:mm:ss"

      return {
        id: meeting.id,
        title: meeting.title,
        start: formatLocal(startTime), // no Z
        end: formatLocal(endTime),
        extendedProps: {
          description: meeting.description,
          status: meeting.status,
          duration_minutes: meeting.duration_minutes,
          conference_room_id: meeting.conference_room_id,
          conference_room_name: meeting.conference_room_name,
          requested_by_name: meeting.requested_by_name,
          requested_by_email: meeting.requested_by_email,
          want_room: meeting.want_room,
          link: meeting.link,
        },
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
    const result = await pool.query("SELECT * FROM offices");
    res.status(200).json(result.rows);
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

    const result = await pool.query("SELECT * FROM users WHERE office = $1", [
      parseInt(office),
    ]);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error fetching users:", err.message);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

const getUsers = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users");
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error fetching users:", err.message);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

const getUserAllRequests = async (req, res) => {
  // Assuming the user's ID is available on the request object after authentication
  const userId = req.user.id;

  if (!userId) {
    return res.status(401).json({ error: "User ID not found in session/token." });
  }

  try {
    const result = await pool.query(
      `SELECT
          m.id,
          m.title,
          m.start_time,
          m.duration_minutes,
          m.want_room,
          m.status,
          m.description,
          m.license,
          u.name AS requested_by_name,
          u.office AS requested_by_office
        FROM meetings m
        JOIN users u ON m.requested_by = u.id
        WHERE m.requested_by = $1
          -- Include all possible statuses: pending, approved, rejected, and cancelled
          AND m.status IN ('pending', 'approved', 'rejected', 'cancelled')
        ORDER BY m.start_time DESC`,
      [userId]
    );

    const meetings = result.rows;

    // Map the results to a client-friendly format
    const clientFriendlyMeetings = meetings.map((m) => {
      // The status 'rejected' or 'cancelled' often corresponds to 'denied' in UI terminology
      const statusAlias = m.status === 'rejected' || m.status === 'cancelled' ? 'denied' : m.status;
      
      const start = new Date(m.start_time);
      const end = new Date(start.getTime() + m.duration_minutes * 60000);

      return {
        id: m.id,
        title: m.title,
        status: statusAlias, // Use aliased status for client
        original_status: m.status, // Keep original status for reference
        start: start.toISOString(),
        end: end.toISOString(),
        extendedProps: {
          description: m.description,
          want_room: m.want_room,
          license: m.license,
          requested_by_name: m.requested_by_name,
        },
      };
    });

    console.log(`Fetched ${clientFriendlyMeetings.length} requests for user ${userId}.`);

    res.json(clientFriendlyMeetings);
  } catch (err) {
    console.error("getUserAllRequests error:", err);
    res.status(500).json({ error: "Failed to retrieve your meeting requests." });
  }
};


module.exports = {
  addMeeting,
  checkLicense,
  checkRoom,
  getApprovedMeetingUser,
  getOffices,
  getUsersByOffice,
  getUsers,
  getUserAllRequests,
};
