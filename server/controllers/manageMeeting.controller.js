const supabase = require("../config/db.js");
const express = require("express");
const pool = require("../config/new_db.js");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const crypto = require("crypto");
const { get } = require("http");
const axios = require("axios");
const { resolve } = require("path");
dotenv.config();

const formatLocal = (d) => {
  const dt = new Date(d);
  const year = dt.getFullYear();
  const month = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  const hours = String(dt.getHours()).padStart(2, "0");
  const minutes = String(dt.getMinutes()).padStart(2, "0");
  const seconds = String(dt.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "zap14479@gmail.com",
    pass: "rbkq vxxq xgub bpdj",
  },
});

console.log(process.env.EMAIL);
console.log(process.env.PASSWORD);

const updateRejectedMeetings = async () => {
  const now = new Date();
  try {
    const result = await pool.query(
      `UPDATE meetings
       SET status = 'rejected'
       WHERE status = 'pending'
       AND start_time < $1
       RETURNING id, title, start_time, requested_by;`,
      [now]
    );

    if (result.rowCount > 0) {
      console.log("Auto-rejected overdue pending meetings:", result.rows);
    }

    console.log(`Auto-rejected ${result.rowCount} overdue pending meetings`);
  } catch (err) {
    console.error("updateRejectedMeetings error:", err);
  }
};

const updateCompletedMeetings = async () => {
  const now = new Date();
  try {
    const result = await pool.query(
      `UPDATE meetings
       SET status = 'completed'
       WHERE status IN ('approved')
       AND (start_time + (duration_minutes * interval '1 minute')) < $1
       RETURNING id;`,
      [now]
    );

    if (result.rowCount > 0) {
      console.log("Completed meetings updated:", result.rows);
    }

    for (const meeting of result.rows) {
      await autoFetchAttendence(meeting.id);
    }
    await autoFetchMissingAttendence();
    await updateRejectedMeetings();

    await deleteOldAttendance();
    console.log(`Updated ${result.rowCount} meetings to 'completed'`);
  } catch (err) {
    console.error("updateCompletedMeetings error:", err);
  }
};

const autoFetchAttendence = async (meetingId) => {
  console.log(`🔍 IN autofetchAtt for meeting: ${meetingId}`);

  try {
    // Check if attendance already exists
    const existing = await pool.query(
      `SELECT id FROM meeting_attendance WHERE meeting_id = $1`,
      [meetingId]
    );

    if (existing.rows.length > 0) {
      console.log(
        `⏩ Attendance already exists for meeting ${meetingId}, skipping...`
      );
      return;
    }

    // Get meeting details with license
    const meeting = await pool.query(
      `SELECT m.*, l.access_token, l.refresh_token, l.token_expiry
       FROM meetings m
       JOIN licenses l ON m.license = l.id
       WHERE m.id = $1`,
      [meetingId]
    );

    if (meeting.rows.length === 0) {
      console.log(`❌ No meeting found with ID: ${meetingId}`);
      return;
    }

    const meetingData = meeting.rows[0];
    console.log(`📋 Meeting found:`, {
      id: meetingData.id,
      title: meetingData.title,
      webex_meeting_id: meetingData.webex_meeting_id,
      status: meetingData.status,
    });

    // Check if webex_meeting_id exists
    if (!meetingData.webex_meeting_id) {
      console.log(`❌ No webex_meeting_id for meeting ${meetingId}`);
      return;
    }

    const accessToken = await getValidAccessToken(meetingData);
    console.log(`🔑 Access token obtained: ${accessToken ? "Yes" : "No"}`);

    // Fetch participants from Webex
    console.log(
      `🌐 Calling Webex API for meeting: ${meetingData.webex_meeting_id}`
    );

    const response = await axios.get(
      `https://webexapis.com/v1/meetingParticipants?meetingId=${meetingData.webex_meeting_id}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );

    console.log(`✅ Webex API Response Status: ${response.status}`);
    console.log(`📊 Participants data:`, {
      itemCount: response.data.items?.length,
      hasData: !!response.data.items,
    });

    // Save to database
    await pool.query(
      `INSERT INTO meeting_attendance (meeting_id, webex_meeting_id, attendance_data)
       VALUES ($1, $2, $3)`,
      [meetingId, meetingData.webex_meeting_id, JSON.stringify(response.data)]
    );

    console.log(`✅ Auto-saved attendance for meeting ${meetingId}`);
  } catch (error) {
    console.error(`❌ Auto-attendance failed for ${meetingId}:`, {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
  }
};

const autoFetchMissingAttendence = async () => {
  console.log("In missing aTT");

  try {
    const missing = await pool.query(
      `SELECT m.id FROM meetings m WHERE m.status = 'completed' AND NOT EXISTS (SELECT 1 FROM meeting_attendance ma WHERE ma.meeting_id = m.id) `
    );

    for (const row of missing.rows) {
      await autoFetchAttendence(row.id);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  } catch (error) {
    console.error("ERROR in auto- fetch missing attendence: ", error.message);
  }
};

const deleteOldAttendance = async () => {
  try {
    const result = await pool.query(
      `DELETE FROM meeting_attendance WHERE created_at < NOW() - INTERVAL '16 days'`
    );

    if (result.rowCount > 0) {
      console.log(
        `DELETED meeting attendance ${result.rowCount} old attendance records (16+days)`
      );
    } else {
      console.log("No old attendance");
    }
  } catch (error) {
    console.error("ERROR in deleting attendance :", err);
  }
};

const getPendingRequests = async (req, res) => {
  const officeId = req.user.officeId;
  console.log(officeId);

  try {
    const result = await pool.query(
      `SELECT m.id, m.title, m.start_time, m.duration_minutes, m.want_room,
              m.status, m.description,
              u.id AS requested_by_id, u.name AS requested_by_name, u.office AS requested_by_office
       FROM meetings m
       JOIN users u ON m.requested_by = u.id
       WHERE m.status = $1`,
      ["pending"]
    );

    // filter by office
    const filtered = result.rows.filter(
      (m) => m.requested_by_office === officeId
    );

    // enrich with license info
    const enriched = await Promise.all(
      filtered.map(async (meeting) => {
        const licensesRes = await pool.query(
          `SELECT id FROM licenses WHERE office_id = $1`,
          [officeId]
        );
        const approvedRes = await pool.query(
          `SELECT license, start_time, duration_minutes
           FROM meetings WHERE status = 'approved'`
        );

        const totalLicenses = licensesRes.rows.length;
        let busyLicenses = new Set();
        const start = new Date(meeting.start_time);
        const end = new Date(
          start.getTime() + meeting.duration_minutes * 60000
        );

        approvedRes.rows.forEach((m) => {
          const s = new Date(m.start_time);
          const e = new Date(s.getTime() + m.duration_minutes * 60000);
          if (!(e <= start || s >= end)) busyLicenses.add(m.license);
        });

        const availableLicenses = totalLicenses - busyLicenses.size;
        return {
          ...meeting,
          //start_time: formatLocal(meeting.start_time),
          licenseInfo: `${availableLicenses}/${totalLicenses}`,
          hasAvailableLicense: availableLicenses > 0,
        };
      })
    );
    console.log("Enriched", enriched);

    res.json(enriched);
  } catch (err) {
    console.error("getPendingRequests error:", err);
    res.status(500).json({ error: "DB error" });
  }
};

const getCancelledMeetings = async (req, res) => {
  const officeId = req.user.officeId;

  try {
    const result = await pool.query(
      `SELECT m.id, m.title, m.start_time, m.duration_minutes, m.want_room, m.description, m.status,
              u.id AS requested_by_id, u.name AS requested_by_name, u.office AS requested_by_office
       FROM meetings m
       JOIN users u ON m.requested_by = u.id
       WHERE m.status IN ('rejected','cancelled')`
    );

    const filtered = result.rows.filter(
      (m) => m.requested_by_office === officeId
    );
    res.json(filtered);
  } catch (err) {
    console.error("getCancelledMeetings error:", err);
    res.status(500).json({ error: "DB error" });
  }
};

const getApprovedMeeting = async (req, res) => {
  const officeId = req.user.officeId;

  try {
    const result = await pool.query(
      `SELECT m.id, m.title, m.start_time, m.duration_minutes, m.want_room,m.description,m.status,
              u.id AS requested_by_id, u.name AS requested_by_name, u.office AS requested_by_office
       FROM meetings m
       JOIN users u ON m.requested_by = u.id
       
       `
    );

    const filtered = result.rows.filter(
      (m) => m.requested_by_office === officeId
    );
    console.log(filtered);

    res.json(filtered);
  } catch (err) {
    console.error("getApprovedMeeting error:", err);
    res.status(500).json({ error: "DB error" });
  }
};

const getCompletedMeetings = async (req, res) => {
  const officeId = req.user.officeId;

  try {
    const result = await pool.query(
      `SELECT m.id, m.title, m.start_time, m.duration_minutes, m.want_room, m.description, m.status,
              u.id AS requested_by_id, u.name AS requested_by_name, u.office AS requested_by_office
       FROM meetings m
       JOIN users u ON m.requested_by = u.id
       WHERE m.status = 'completed' 
       AND u.office = $1
       AND m.start_time >= CURRENT_DATE - INTERVAL '15  days'`,
      [officeId]
    );

    const filtered = result.rows.filter(
      (m) => m.requested_by_office === officeId
    );

    const meetingsWithColors = filtered.map((meeting) => ({
      ...meeting,
      backgroundColor: getStatusColor(meeting.status),
      borderColor: getStatusColor(meeting.status, true),
    }));
    res.json(meetingsWithColors);
  } catch (err) {
    console.error("getCompletedMeetings error:", err);
    res.status(500).json({ error: "DB error" });
  }
};

const getAvailableRooms = async (req, res) => {
  const { meeting_id } = req.query;

  try {
    const meetingRes = await pool.query(
      `SELECT m.start_time, m.duration_minutes, u.office
       FROM meetings m
       JOIN users u ON m.requested_by = u.id
       WHERE m.id = $1`,
      [meeting_id]
    );

    if (meetingRes.rows.length === 0)
      return res.status(400).json({ error: "Invalid meeting ID" });

    const meeting = meetingRes.rows[0];
    const officeId = meeting.office;
    const start = new Date(meeting.start_time);
    const end = new Date(start.getTime() + meeting.duration_minutes * 60000);

    const roomsRes = await pool.query(
      `SELECT id, name FROM conference_room WHERE office_id = $1`,
      [officeId]
    );

    const roomIds = roomsRes.rows.map((r) => r.id);

    const meetingsRes = await pool.query(
      `SELECT conference_room_id, start_time, duration_minutes
       FROM meetings
       WHERE status = 'approved' AND conference_room_id = ANY($1)`,
      [roomIds]
    );

    const busyRooms = new Set();
    meetingsRes.rows.forEach((m) => {
      const s = new Date(m.start_time);
      const e = new Date(s.getTime() + m.duration_minutes * 60000);
      if (!(e <= start || s >= end)) busyRooms.add(m.conference_room_id);
    });

    const available = roomsRes.rows.filter((r) => !busyRooms.has(r.id));
    res.json(available);
  } catch (err) {
    console.error("getAvailableRooms error:", err);
    res.status(500).json({ error: "DB error" });
  }
};

const getAvailableLicenses = async (req, res) => {
  const { meeting_id } = req.query;

  try {
    const meetingRes = await pool.query(
      `SELECT m.start_time, m.duration_minutes, u.office
       FROM meetings m
       JOIN users u ON m.requested_by = u.id
       WHERE m.id = $1`,
      [meeting_id]
    );
    if (meetingRes.rows.length === 0)
      return res.status(400).json({ error: "Invalid meeting ID" });

    const meeting = meetingRes.rows[0];
    const officeId = meeting.office;
    const start = new Date(meeting.start_time);
    const end = new Date(start.getTime() + meeting.duration_minutes * 60000);

    const licensesRes = await pool.query(
      `SELECT id, office_id, account FROM licenses WHERE office_id = $1`,
      [officeId]
    );
    if (licensesRes.rows.length === 0) return res.json([]);

    const licenseIds = licensesRes.rows.map((l) => l.id);
    const meetingsRes = await pool.query(
      `SELECT license, start_time, duration_minutes
       FROM meetings
       WHERE status = 'approved' AND license = ANY($1)`,
      [licenseIds]
    );

    const busyLicenses = new Set();
    meetingsRes.rows.forEach((m) => {
      const s = new Date(m.start_time);
      const e = new Date(s.getTime() + m.duration_minutes * 60000);
      if (!(e <= start || s >= end)) busyLicenses.add(m.license);
    });

    const available = licensesRes.rows.filter((l) => !busyLicenses.has(l.id));
    res.json({ licenses: available });
  } catch (err) {
    console.error("getAvailableLicenses error:", err);
    res.status(500).json({ error: "DB error" });
  }
};

const approveMeeting = async (req, res) => {
  const { meeting_id } = req.body;

  try {
    const meetingRes = await pool.query(
      `SELECT 
        m.id,
        m.title,
        m.start_time,
        m.duration_minutes,
        m.want_room,
        u.office,
        m.description,
        m.status,
        u.email AS requester_email
      FROM meetings m
      JOIN users u ON m.requested_by = u.id
      WHERE m.id = $1`,
      [meeting_id]
    );

    if (meetingRes.rows.length === 0)
      return res.status(404).json({ message: "Meeting not found" });

    const meeting = meetingRes.rows[0];
    console.log("📅 Meeting details:", meeting);

    const officeId = meeting.office;
    const start = new Date(meeting.start_time);
    const end = new Date(start.getTime() + meeting.duration_minutes * 60000);

    // find license
    const licenseRes = await pool.query(
      `SELECT id FROM licenses WHERE office_id = $1`,
      [officeId]
    );

    if (licenseRes.rows.length === 0)
      return res
        .status(400)
        .json({ message: "No licenses available for this office" });

    const licenseIds = licenseRes.rows.map((l) => l.id);
    const licenseMeetings = await pool.query(
      `SELECT license, start_time, duration_minutes
       FROM meetings
       WHERE status = 'approved' AND license = ANY($1)`,
      [licenseIds]
    );

    const busyLicenses = new Set();
    licenseMeetings.rows.forEach((m) => {
      const s = new Date(m.start_time);
      const e = new Date(s.getTime() + m.duration_minutes * 60000);
      if (!(e <= start || s >= end)) busyLicenses.add(m.license);
    });

    const availableLicense = licenseRes.rows.find(
      (l) => !busyLicenses.has(l.id)
    );

    if (!availableLicense)
      return res.status(400).json({ message: "No license available" });

    // Get full license details including tokens
    const licenseDetails = await pool.query(
      `SELECT * FROM licenses WHERE id = $1`,
      [availableLicense.id]
    );

    if (licenseDetails.rows.length === 0)
      return res.status(400).json({ message: "License details not found" });

    const license = licenseDetails.rows[0];
    console.log("🔑 License details:", {
      account: license.account,
      has_access_token: !!license.access_token,
      has_refresh_token: !!license.refresh_token,
    });

    // Get valid access token
    const accessToken = await getValidAccessToken(license);
    console.log("✅ Access token:", accessToken ? "Present" : "Missing");

    if (!accessToken) {
      return res.status(500).json({ message: "Failed to get access token" });
    }

    // Convert UTC from DB to IST
    const convertUTCtoIST = (utcDate) => {
      const istDate = new Date(utcDate.getTime() + 5.5 * 60 * 60 * 1000);
      return istDate.toISOString().replace("Z", "");
    };

    const startDate = new Date(meeting.start_time);
    const endDate = new Date(
      startDate.getTime() + meeting.duration_minutes * 60000
    );

    const startISO = convertUTCtoIST(startDate);
    const endISO = convertUTCtoIST(endDate);

    console.log("🕐 Time Conversion:", {
      from_db_utc: meeting.start_time,
      to_webex_ist: startISO,
      human_readable: new Date(meeting.start_time).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
      }),
    });
    const participantsRes = await pool.query(
      `
  SELECT 
    u.email AS email
  FROM meeting_participants mp
  JOIN users u ON mp.user_id = u.id
  WHERE mp.meeting_id = $1
`,
      [meeting_id]
    );

    const participantsEmails = participantsRes.rows.map((r) => r.email);

    const webexMeetingData = {
      title: meeting.title.substring(0, 128),
      start: startISO,
      end: endISO,
      timezone: "Asia/Kolkata",
      agenda: (meeting.description || "Meeting created by system").substring(
        0,
        1300
      ),
      invitees: participantsEmails.map((email) => ({ email })),
      hostEmail: license.account,
      enabledJoinBeforeHost: true,
      joinBeforeHostMinutes: 15,
      waitingRoom: false,
      allowAnyUserToBeCoHost: true,
    };

    console.log("📤 Webex API Request Data:", {
      title_length: webexMeetingData.title.length,
      agenda_length: webexMeetingData.agenda.length,
      start: webexMeetingData.start,
      end: webexMeetingData.end,
      data: webexMeetingData,
    });

    // Create Webex meeting
    console.log("🔄 Creating Webex meeting...");

    const webexMeetingRes = await axios.post(
      "https://webexapis.com/v1/meetings",
      webexMeetingData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );

    console.log("✅ Webex API Response:", {
      status: webexMeetingRes.status,
      meeting_id: webexMeetingRes.data.id,
      webLink: webexMeetingRes.data.webLink,
    });

    const meeting_link = webexMeetingRes.data.webLink;
    const webexMeetingId = webexMeetingRes.data.id;

    await checkWebexInvitees(webexMeetingId, accessToken);

    // find room if needed (moved after Webex creation so we don't hold resources if Webex fails)
    let assignedRoom = null;
    if (meeting.want_room) {
      const roomsRes = await pool.query(
        `SELECT id FROM conference_room WHERE office_id = $1`,
        [officeId]
      );
      const roomIds = roomsRes.rows.map((r) => r.id);

      const roomMeetings = await pool.query(
        `SELECT conference_room_id, start_time, duration_minutes
         FROM meetings
         WHERE status = 'approved' AND conference_room_id = ANY($1)`,
        [roomIds]
      );

      const busyRooms = new Set();
      roomMeetings.rows.forEach((m) => {
        const s = new Date(m.start_time);
        const e = new Date(s.getTime() + m.duration_minutes * 60000);
        if (!(e <= start || s >= end)) busyRooms.add(m.conference_room_id);
      });

      assignedRoom = roomsRes.rows.find((r) => !busyRooms.has(r.id));
      if (!assignedRoom) {
        console.log("⚠️ No room available, but continuing without room");
        // Don't fail the meeting if no room available
      }
    }

    // Update meeting in database
    await pool.query(
      `UPDATE meetings
       SET license = $1, conference_room_id = $2, status = 'approved', link = $3, webex_meeting_id = $4
       WHERE id = $5`,
      [
        availableLicense.id,
        assignedRoom ? assignedRoom.id : null,
        meeting_link,
        webexMeetingId,
        meeting_id,
      ]
    );

    console.log("Extracted emails:", participantsEmails); // Debug log

    // Make sure meeting.requester_email exists
    console.log("Requester email:", meeting.requester_email); // Debug log

    if (!participantsEmails.includes(meeting.requester_email)) {
      participantsEmails.push(meeting.requester_email);
    }

    console.log("Final email list:", participantsEmails); // Debug log

    const subject = `Meeting Approved: ${meeting.title}`;
    const message = `
  Your meeting request has been approved!

  Title: ${meeting.title}
  Start Time: ${meeting.start_time}
  Duration: ${meeting.duration_minutes} minutes
  Meeting Link: ${meeting_link}

  Please join using the above link at the scheduled time.
  Do not share this link with anyone outside your organization.
`;

    await Promise.all(
      participantsEmails.map((email) =>
        transporter.sendMail({
          from: process.env.EMAIL,
          to: email,
          subject,
          text: message,
        })
      )
    );

    console.log("✅ Emails sent to participants:", participantsEmails);

    res.json({
      success: true,
      message: "Meeting approved",
      assignedLicense: availableLicense.id,
      assignedRoom: assignedRoom ? assignedRoom.id : null,
      link: meeting_link,
      webex_meeting_id: webexMeetingId,
    });
  } catch (err) {
    console.error("❌ APPROVE MEETING ERROR:");
    console.error("Error status:", err.response?.status);
    console.error("Error data:", err.response?.data);
    console.error("Error message:", err.message);

    if (err.response?.status === 400) {
      console.error("🔍 400 BAD REQUEST DETAILS:");
      console.error(
        "Webex API Error:",
        JSON.stringify(err.response?.data, null, 2)
      );
      console.error("Request sent:", err.config?.data);
    }

    res.status(500).json({
      error: "Failed to approve meeting",
      details: err.response?.data || err.message,
    });
  }
};

// ✅ Reject Meeting
const rejectMeeting = async (req, res) => {
  const { meeting_id } = req.body;

  try {
    const meetingRes = await pool.query(
      `SELECT m.title, u.email AS requester_email
       FROM meetings m
       JOIN users u ON m.requested_by = u.id
       WHERE m.id = $1`,
      [meeting_id]
    );

    if (meetingRes.rows.length === 0)
      return res.status(404).json({ message: "Meeting not found" });

    const meeting = meetingRes.rows[0];

    await pool.query(`UPDATE meetings SET status = 'rejected' WHERE id = $1`, [
      meeting_id,
    ]);

    // Send rejection email only to requester
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: meeting.requester_email,
      subject: `Meeting Rejected: ${meeting.title}`,
      text: `
        Your meeting request for "${meeting.title}" has been rejected.
        Please contact your admin for more details.
      `,
    });

    res.json({ message: "Meeting rejected and requester notified" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Add Meeting
const addMeeting = async (req, res) => {
  const userId = req.user.userId;
  const officeId = req.user.officeId;

  const {
    title,
    description,
    start_time,
    duration_minutes,
    want_room,
    participants,
  } = req.body;

  try {
    const meeting_link = `https://webex.com/meet/${Math.random()
      .toString(36)
      .substring(2, 10)}`;

    const inserted = await pool.query(
      `INSERT INTO meetings (title, description, start_time, duration_minutes, requested_by, status, want_room, license, conference_room_id, link)
       VALUES ($1,$2,$3,$4,$5,'approved',$6,NULL,NULL,$7)
       RETURNING *`,
      [
        title,
        description,
        start_time,
        duration_minutes,
        userId,
        want_room,
        meeting_link,
      ]
    );

    const meeting = inserted.rows[0];

    if (Array.isArray(participants) && participants.length > 0) {
      const values = participants.map((id, i) => `($1, $${i + 2})`).join(",");
      await pool.query(
        `INSERT INTO meeting_participants (meeting_id, user_id) VALUES ${values}`,
        [meeting.id, ...participants]
      );
    }

    res.json({ success: true, message: "Meeting scheduled", meeting });
  } catch (err) {
    console.error("addMeeting error:", err);
    res.status(500).json({ error: "DB error" });
  }
};

const acceptMeetingRecordingRequest = async (req, res) => {
  const { request_id } = req.body;
  const adminId = req.user.userId;

  try {
    // 1. Get recording request details
    const requestQuery = `
      SELECT 
        mrr.*,
        m.webex_meeting_id,
        m.license,
        m.title as meeting_title,
        l.access_token,
        l.client_id,
        l.client_secret,
        l.refresh_token
      FROM meeting_recording_requests mrr
      JOIN meetings m ON mrr.meeting_id = m.id
      JOIN licenses l ON m.license = l.id
      WHERE mrr.id = $1
    `;

    const requestResult = await pool.query(requestQuery, [request_id]);

    if (requestResult.rows.length === 0) {
      return res.status(404).json({ message: "Recording request not found" });
    }

    const recordingRequest = requestResult.rows[0];

    // 2. Get access token
    const accessToken = await getValidAccessToken({
      id: recordingRequest.license,
      client_id: recordingRequest.client_id,
      client_secret: recordingRequest.client_secret,
      refresh_token: recordingRequest.refresh_token,
      access_token: recordingRequest.access_token,
    });

    // 3. Fetch recording from Webex
    console.log(
      `Fetching recording for meeting: ${recordingRequest.webex_meeting_id}`
    );

    const recordingsRes = await axios.get(
      `https://webexapis.com/v1/recordings?meetingId=${recordingRequest.webex_meeting_id}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    // 4. Check if recording exists
    if (recordingsRes.data.items.length === 0) {
      return res.status(404).json({
        message: "Recording not yet available in Webex",
      });
    }

    // 5. Get recording URL
    const recording = recordingsRes.data.items[0];
    const recordingUrl =
      recording.downloadUrl || recording.playbackUrl || recording.shareUrl;

    console.log(`Recording found: ${recordingUrl}`);

    // 6. Update request with recording URL
    const updateResult = await pool.query(
      `UPDATE meeting_recording_requests
       SET status = 'completed', 
           recording_url = $1, 
       WHERE id = $2
       RETURNING *;`,
      [recordingUrl, request_id]
    );

    const updatedRequest = updateResult.rows[0];

    // 7. Send email to user
    const userQuery = `SELECT email, name FROM users WHERE id = $1`;
    const userResult = await pool.query(userQuery, [
      recordingRequest.requested_by,
    ]);

    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      await transporter.sendMail({
        from: process.env.EMAIL,
        to: user.email,
        subject: `Recording Available: ${recordingRequest.meeting_title}`,
        text: `
          Your meeting recording is now available!
          
          Meeting: ${recordingRequest.meeting_title}
          Recording URL: ${recordingUrl}
          
          You can access the recording using the link above.
        `,
      });
      console.log(`Email sent to ${user.email}`);
    }

    res.json({
      success: true,
      message: "Recording request completed successfully",
      recording_url: recordingUrl,
      request: updatedRequest,
    });
  } catch (err) {
    console.error("Error accepting recording request:", err);
    res.status(500).json({
      error: "Failed to process recording request",
      details: err.message,
    });
  }
};

const rejectMeetingRecordingRequest = async (req, res) => {
  const { request_id } = req.body;

  try {
    // 1. Get the request details including user info for email
    const requestQuery = `
      SELECT 
        mrr.*,
        m.title as meeting_title,
        u.email as user_email,
        u.name as user_name
      FROM meeting_recording_requests mrr
      JOIN meetings m ON mrr.meeting_id = m.id
      JOIN users u ON mrr.requested_by = u.id
      WHERE mrr.id = $1
    `;

    const requestResult = await pool.query(requestQuery, [request_id]);

    if (requestResult.rows.length === 0) {
      return res.status(404).json({ message: "Request not found" });
    }

    const recordingRequest = requestResult.rows[0];

    // 2. Update the request status to rejected
    const updateResult = await pool.query(
      `UPDATE meeting_recording_requests
       SET status = 'rejected',
       WHERE id = $1
       RETURNING *;`,
      [request_id]
    );

    const updatedRequest = updateResult.rows[0];

    // 3. Send rejection email to the user
    try {
      await transporter.sendMail({
        from: process.env.EMAIL,
        to: recordingRequest.user_email,
        subject: `Recording Request Rejected: ${recordingRequest.meeting_title}`,
        text: `
          Your recording request has been rejected.
          
          Meeting: ${recordingRequest.meeting_title}
          Request ID: ${request_id}
          
          If you believe this was a mistake, please contact your administrator.
        `,
      });
      console.log(`✅ Rejection email sent to ${recordingRequest.user_email}`);
    } catch (emailError) {
      console.error("Failed to send rejection email:", emailError);
      // Continue even if email fails
    }

    res.json({
      success: true,
      message: "Recording request rejected successfully",
      request: updatedRequest,
    });
  } catch (err) {
    console.error("Error rejecting recording request:", err);
    res.status(500).json({
      success: false,
      error: "Database error",
    });
  }
};

const getRecordingRequestsByStatus = async (req, res) => {
  const adminOfficeId = req.user.officeId;
  const { status } = req.params; // 'pending', 'approved', 'completed', 'rejected'

  try {
    const result = await pool.query(
      `
      SELECT 
        mrr.id as request_id,
        mrr.meeting_id,
        mrr.requested_at,
        mrr.status,
        mrr.recording_url,
        m.title as meeting_title,
        m.start_time,
        m.duration_minutes,
        u.name as requester_name,
        u.email as requester_email,
        u.department as requester_department
      FROM meeting_recording_requests mrr
      JOIN meetings m ON mrr.meeting_id = m.id
      JOIN users u ON mrr.requested_by = u.id
      WHERE u.office = $1 AND mrr.status = $2
      ORDER BY mrr.requested_at DESC
    `,
      [adminOfficeId, status]
    );

    res.json({
      success: true,
      status: status,
      count: result.rows.length,
      requests: result.rows,
    });
  } catch (err) {
    console.error("Error fetching recording requests by status:", err);
    res.status(500).json({ error: "Database error" });
  }
};

async function getValidAccessToken(license) {
  const now = new Date();

  // Check if we have a valid access token
  if (
    license.access_token &&
    license.token_expiry &&
    new Date(license.token_expiry) > now
  ) {
    console.log("✅ Using existing valid access token");
    return license.access_token;
  }

  console.log("🔄 Access token expired or missing, refreshing...");

  try {
    const response = await axios.post(
      "https://webexapis.com/v1/access_token",
      new URLSearchParams({
        grant_type: "refresh_token",
        client_id: license.client_id,
        client_secret: license.client_secret,
        refresh_token: license.refresh_token,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const newAccessToken = response.data.access_token;
    const newRefreshToken = response.data.refresh_token;
    const expiresIn = response.data.expires_in;

    console.log("✅ New access token obtained");
    console.log("Expires in:", expiresIn, "seconds");

    // Update both tokens and expiry in DB
    const expiryTime = new Date();
    expiryTime.setSeconds(expiryTime.getSeconds() + expiresIn - 60); // 60 second safety margin

    await pool.query(
      `UPDATE licenses 
       SET access_token = $1, refresh_token = $2, token_expiry = $3
       WHERE id = $4`,
      [newAccessToken, newRefreshToken, expiryTime, license.id]
    );

    console.log("✅ Tokens updated in database");
    return newAccessToken;
  } catch (err) {
    console.error(
      "❌ Failed to refresh access token:",
      err.response?.data || err.message
    );
    throw err;
  }
}

const getStatusColor = (status, border = false) => {
  const colors = {
    pending: border ? "#f59e0b" : "#fbbf24",
    approved: border ? "#10b981" : "#34d399",
    rejected: border ? "#ef4444" : "#f87171",
    completed: border ? "#6b7280" : "#9ca3af",
  };
  return colors[status] || (border ? "#6b7280" : "#9ca3af");
};
async function checkWebexInvitees(meetingId, accessToken) {
  try {
    const response = await axios.get(
      `https://webexapis.com/v1/meetings/${meetingId}/invitees`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    console.log("Invites in webex meeting: ", response.data.items);
    return response.data.items;
  } catch (error) {
    console.error(
      "ERROR in fetching the invitees: ",
      error.response?.data || error.message
    );
  }
}

setInterval(updateCompletedMeetings, 30 * 60 * 1000);
setTimeout(updateCompletedMeetings, 5000);

module.exports = {
  getPendingRequests,
  getCancelledMeetings,
  getApprovedMeeting,
  getCompletedMeetings,
  getAvailableRooms,
  getAvailableLicenses,
  approveMeeting,
  rejectMeeting,
  addMeeting,
  acceptMeetingRecordingRequest,
  rejectMeetingRecordingRequest,
  getRecordingRequestsByStatus,
};
