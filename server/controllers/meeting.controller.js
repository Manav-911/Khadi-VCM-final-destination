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

  console.log("Received officeId type:", typeof officeId);
  console.log("Raw start_time from frontend:", req.body.start_time);

  const {
    title,
    description,
    start_time,
    duration_minutes,
    want_room,
    participants,
  } = req.body;

  console.log("Participants: ", participants);

  // Parse the ISO string - this automatically handles timezone conversion
  const newStartTime = new Date(start_time);
  console.log("Parsed start_time (local server time):", newStartTime);
  console.log("Parsed start_time (ISO):", newStartTime.toISOString());
  console.log("Parsed start_time (UTC):", newStartTime.toUTCString());

  const endTime = new Date(newStartTime.getTime() + duration_minutes * 60000);
  console.log("Calculated end_time:", endTime);
  console.log("Calculated end_time (ISO):", endTime.toISOString());

  // Convert to IST for logging/debugging
  const istStartTime = newStartTime.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
  });
  console.log("Start time in IST:", istStartTime);

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

  // Store the UTC time in database
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
  } else if (participants && Array.isArray(participants.individuals)) {
    participantIds = participants.individuals
      .map((id) => Number(id))
      .filter((id) => !isNaN(id));
  } else if (typeof participants === "string") {
    try {
      const parsed = JSON.parse(participants);
      if (Array.isArray(parsed)) {
        participantIds = parsed
          .map((id) => Number(id))
          .filter((id) => !isNaN(id));
      }
    } catch (err) {
      console.error("❌ Error parsing participants string:", err.message);
    }
  }

  console.log("👥 Processed participant IDs:", participantIds);
  console.log("👥 Participant IDs length:", participantIds.length);

  // FIX: Simple and clear participant insertion
  if (participantIds.length > 0) {
    console.log("🎯 STARTING participant insertion...");

    try {
      // Method 1: Simple loop with individual inserts
      for (let i = 0; i < participantIds.length; i++) {
        const user_id = participantIds[i];
        console.log(
          `📝 Inserting participant ${i + 1}/${
            participantIds.length
          }: user_id ${user_id} for meeting ${meetingId}`
        );

        await pool.query(
          `INSERT INTO meeting_participants (meeting_id, user_id) VALUES ($1, $2)`,
          [meetingId, user_id]
        );

        console.log(`✅ Successfully added participant: user_id ${user_id}`);
      }

      console.log(
        `🎉 ALL participants added successfully! Total: ${participantIds.length}`
      );
    } catch (error) {
      console.error("💥 ERROR in participant insertion:", error);
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        detail: error.detail,
      });

      // Don't fail the whole request if participants fail?
      // Or you might want to rollback the meeting insertion
    }
  } else {
    console.log("ℹ️ No participants to add");
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
   WHERE (m.status = 'approved' OR m.status = 'completed') AND u.office = $1
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

const cancelUserMeeting = async (req, res) => {
  const userId = req.user.userId; // user ID from JWT
  const meetingId = req.params.id; // meeting ID from route params

  try {
    const meetingRes = await pool.query(
      `
      SELECT m.*, u.email as requester_email, u.name as requester_name
      FROM meetings m
      JOIN users u ON m.requested_by = u.id
      WHERE m.id = $1 AND m.requested_by = $2
    `,
      [meetingId, userId]
    );

    if (meetingRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "Meeting not found or you dont have permission to cancel this meeting.",
      });
    }

    const meeting = meetingRes.rows[0];

    if (meeting.status === "cancelled" || meeting.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Meeting is completed or cancelled",
      });
    }

    if (meeting.status === "approved" && meeting.webex_meeting_id) {
      await cancelWebexMeeting(meeting);
    }

    await pool.query(`UPDATE meeting SET status = 'cancelled' WHERE id = $1`, [
      meetingId,
    ]);

    await notifyAdminAboutCancellation(meeting);

    await notifyParticipantsAboutCancellation(meetingId, meeting);

    console.log(`Meeting cancelled ${meetingId}`);

    res.json({
      success: true,
      message: "Meeting cancelled successfully",
      meeting_id: meetingId,
    });
  } catch (error) {
    console.error("Error cancelling meeting:", err);
    res.status(500).json({
      success: false,
      error: "Failed to cancel meeting",
    });
  }
};
const cancelWebexMeeting = async (meeting) => {
  try {
    // Get license details for access token
    const licenseRes = await pool.query(
      `
      SELECT l.* FROM licenses l 
      WHERE l.id = $1
    `,
      [meeting.license]
    );

    if (licenseRes.rows.length === 0) {
      console.log("❌ License not found for Webex cancellation");
      return;
    }

    const license = licenseRes.rows[0];
    const accessToken = await getValidAccessToken(license);

    // Delete meeting from Webex
    await axios.delete(
      `https://webexapis.com/v1/meetings/${meeting.webex_meeting_id}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    console.log(`✅ Webex meeting ${meeting.webex_meeting_id} deleted`);
  } catch (err) {
    console.error(
      "❌ Error cancelling Webex meeting:",
      err.response?.data || err.message
    );
    // Don't fail the entire cancellation if Webex fails
  }
};

const notifyAdminAboutCancellation = async (meeting) => {
  try {
    // Get admin emails from the same office
    const adminsRes = await pool.query(
      `
      SELECT email, name FROM admin 
      WHERE office = $1 
    `,
      [meeting.office]
    );

    const adminEmails = adminsRes.rows.map((admin) => admin.email);

    if (adminEmails.length === 0) return;

    await transporter.sendMail({
      from: process.env.EMAIL,
      to: adminEmails,
      subject: `Meeting Cancelled: ${meeting.title}`,
      html: `
        <h2>Meeting Cancelled</h2>
        <p><strong>Meeting:</strong> ${meeting.title}</p>
        <p><strong>Cancelled by:</strong> ${meeting.requester_name} (${
        meeting.requester_email
      })</p>
        <p><strong>Original Time:</strong> ${new Date(
          meeting.start_time
        ).toLocaleString()}</p>
        <p><strong>Duration:</strong> ${meeting.duration_minutes} minutes</p>
        ${
          meeting.webex_meeting_id
            ? `<p><strong>Webex Meeting ID:</strong> ${meeting.webex_meeting_id}</p>`
            : ""
        }
      `,
    });

    console.log(
      `✅ Admin notification sent for cancelled meeting ${meeting.id}`
    );
  } catch (emailError) {
    console.error("Failed to send admin notification:", emailError);
  }
};
const notifyParticipantsAboutCancellation = async (meetingId, meeting) => {
  try {
    const participantsRes = await pool.query(
      `
      SELECT u.email, u.name 
      FROM meeting_participants mp
      JOIN users u ON mp.user_id = u.id
      WHERE mp.meeting_id = $1
    `,
      [meetingId]
    );

    const participantEmails = participantsRes.rows.map((p) => p.email);

    // Include requester if not already in list
    if (!participantEmails.includes(meeting.requester_email)) {
      participantEmails.push(meeting.requester_email);
    }

    if (participantEmails.length === 0) return;

    await transporter.sendMail({
      from: process.env.EMAIL,
      to: participantEmails,
      subject: `Meeting Cancelled: ${meeting.title}`,
      html: `
        <h2>Meeting Cancelled</h2>
        <p>The following meeting has been cancelled:</p>
        <p><strong>Title:</strong> ${meeting.title}</p>
        <p><strong>Time:</strong> ${new Date(
          meeting.start_time
        ).toLocaleString()}</p>
        <p><strong>Duration:</strong> ${meeting.duration_minutes} minutes</p>
        <p>Please update your calendar accordingly.</p>
      `,
    });

    console.log(
      `✅ Participant notifications sent for cancelled meeting ${meetingId}`
    );
  } catch (emailError) {
    console.error("Failed to send participant notifications:", emailError);
  }
};

const requestMeetingRecording = async (req, res) => {
  const { meetingId } = req.params;
  const userId = req.user.userId; // Assuming this comes from your auth middleware

  try {
    // 1. Check if the meeting exists (your existing code)
    const meetingQuery =
      "SELECT id FROM meetings WHERE id = $1 AND status = 'completed'";
    const meetingResult = await pool.query(meetingQuery, [meetingId]);

    if (meetingResult.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Meeting not found" });
    }

    const webex_meeting_id = meetingResult.rows[0].webex_meeting_id;

    const existingRequestQuery = `SELECT id FROM meeting_recording_requests WHERE meeting_id = $1 AND requested_by = $2`;
    const existingRequestResult = await pool.query(existingRequestQuery, [
      meetingId,
      userId,
    ]);

    if (existingRequestResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Recording request already exists for this meeting",
      });
    }

    // 2. Insert a new recording request
    const insertQuery = `INSERT INTO meeting_recording_requests (meeting_id, requested_by, status) VALUES ($1, $2, 'pending') RETURNING *`;
    const insertResult = await pool.query(insertQuery, [meetingId, userId]);

    return res.status(200).json({
      success: true,
      message: "Recording request created successfully",
      data: insertResult.rows[0],
    });
  } catch (error) {
    console.error("Error creating recording request:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while creating recording request",
    });
  }
};
const getMeetingAttendance = async (req, res) => {
  const { meeting_id } = req.params;
  const userId = req.user.userId;

  console.log("📊 Fetching attendance for meeting:", meeting_id);

  try {
    // 1. Verify meeting exists and user has permission
    const meetingResult = await pool.query(
      `SELECT m.*, u.id as requester_id 
       FROM meetings m 
       JOIN users u ON m.requested_by = u.id 
       WHERE m.id = $1`,
      [meeting_id]
    );

    if (meetingResult.rows.length === 0) {
      return res.status(404).json({ error: "Meeting not found" });
    }

    const meetingData = meetingResult.rows[0];

    // if (userRole !== 'admin' && meetingData.requester_id !== userId) {
    //   return res.status(403).json({ error: "Access denied" });
    // }

    // 2. Get attendance data
    const attendanceRes = await pool.query(
      `SELECT attendance_data FROM meeting_attendance WHERE meeting_id = $1`,
      [meeting_id]
    );

    if (attendanceRes.rows.length === 0) {
      return res.status(404).json({ error: "No attendance data found" });
    }

    // 3. Handle the data - try direct use first, then parse if needed
    let attendanceData = attendanceRes.rows[0].attendance_data;

    // If it's a string, try to parse it
    if (typeof attendanceData === "string") {
      try {
        attendanceData = JSON.parse(attendanceData);
      } catch (error) {
        console.error("JSON parse error:", error);
        return res
          .status(500)
          .json({ error: "Invalid attendance data format" });
      }
    }

    // 4. Process the data (handle different possible structures)
    const participants =
      attendanceData.items ||
      attendanceData.participants ||
      attendanceData ||
      [];

    const processed = participants.map((p) => ({
      name: p.displayName || p.name || "Unknown",
      email: p.email || "",
      attended: p.joinTime != null,
      joinTime: p.joinTime ? new Date(p.joinTime).toLocaleString() : null,
      duration: p.duration ? Math.round(p.duration / 60000) + " mins" : "N/A",
    }));

    const attendedCount = processed.filter((p) => p.attended).length;
    const totalParticipants = processed.length;
    const attendanceRate =
      totalParticipants > 0
        ? Math.round((attendedCount / totalParticipants) * 100)
        : 0;

    res.json({
      success: true,
      totalParticipants,
      attendedCount,
      attendanceRate,
      participants: processed,
    });
  } catch (error) {
    console.error("Error fetching attendance:", error);
    res.status(500).json({ error: "Server error" });
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
  cancelUserMeeting,
  requestMeetingRecording,
  getMeetingAttendance,
};
