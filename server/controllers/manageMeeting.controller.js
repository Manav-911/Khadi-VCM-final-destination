const supabase = require("../config/db.js");
const express = require("express");
const pool = require("../config/new_db.js");

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

const getPendingRequests = async (req, res) => {
  const officeId = req.user.officeId;

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
      `SELECT m.id, m.title, m.start_time, m.duration_minutes, m.want_room,
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
      `SELECT m.id, m.title, m.start_time, m.duration_minutes, m.want_room,
              u.id AS requested_by_id, u.name AS requested_by_name, u.office AS requested_by_office
       FROM meetings m
       JOIN users u ON m.requested_by = u.id
       WHERE m.status = 'approved'`
    );

    const filtered = result.rows.filter(
      (m) => m.requested_by_office === officeId
    );
    res.json(filtered);
  } catch (err) {
    console.error("getApprovedMeeting error:", err);
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
      `SELECT m.id, m.start_time, m.duration_minutes, m.want_room, u.office
       FROM meetings m
       JOIN users u ON m.requested_by = u.id
       WHERE m.id = $1`,
      [meeting_id]
    );
    if (meetingRes.rows.length === 0)
      return res.status(404).json({ message: "Meeting not found" });

    const meeting = meetingRes.rows[0];
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

    // find room if needed
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
      if (!assignedRoom)
        return res.status(400).json({ message: "No room available" });
    }

    const meeting_link = `https://webex.com/meet/${Math.random()
      .toString(36)
      .substring(2, 10)}`;

    await pool.query(
      `UPDATE meetings
       SET license = $1, conference_room_id = $2, status = 'approved', link = $3
       WHERE id = $4`,
      [
        availableLicense.id,
        assignedRoom ? assignedRoom.id : null,
        meeting_link,
        meeting_id,
      ]
    );

    res.json({
      success: true,
      message: "Meeting approved",
      assignedLicense: availableLicense.id,
      assignedRoom: assignedRoom ? assignedRoom.id : null,
      link: meeting_link,
    });
  } catch (err) {
    console.error("approveMeeting error:", err);
    res.status(500).json({ error: "DB error" });
  }
};

// ✅ Reject Meeting
const rejectMeeting = async (req, res) => {
  const { meeting_id } = req.body;
  try {
    await pool.query(`UPDATE meetings SET status = 'rejected' WHERE id = $1`, [
      meeting_id,
    ]);
    await pool.query(`DELETE FROM meeting_participants WHERE meeting_id = $1`, [
      meeting_id,
    ]);

    res.json({
      success: true,
      message: "Meeting rejected and participants removed",
    });
  } catch (err) {
    console.error("rejectMeeting error:", err);
    res.status(500).json({ error: "DB error" });
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

module.exports = {
  getPendingRequests,
  getCancelledMeetings,
  getApprovedMeeting,
  getAvailableRooms,
  getAvailableLicenses,
  approveMeeting,
  rejectMeeting,
  addMeeting,
};
