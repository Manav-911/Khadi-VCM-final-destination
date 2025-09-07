const supabase = require("../config/db.js");
const express = require("express");

const getPendingRequests = async (req, res) => {
  const officeId = req.user.officeId;

  const { data, error } = await supabase
    .from("meetings")
    .select(
      `
      id,
      title,
      start_time,
      duration_minutes,
      want_room,
      requested_by (
        id,
        name,
        office
      )
    `
    )
    .eq("status", "pending");

  if (error) return res.status(500).json({ error });

  // Filter based on user's office
  const filtered = data.filter((m) => m.requested_by.office === officeId);

  res.json(filtered);
};

const getCancelledMeetings = async (req, res) => {
  const officeId = req.user.officeId;

  const { data, error } = await supabase
    .from("meetings")
    .select(
      `
      id,
      title,
      start_time,
      duration_minutes,
      want_room,
      requested_by (
        id,
        name,
        office
      )
    `
    )
    .in("status", ["rejected", "cancelled"]);

  if (error) return res.status(500).json({ error });
  const filtered = data.filter((m) => m.requested_by.office === officeId);

  res.status(200).json(filtered);
};

const getApprovedMeeting = async (req, res) => {
  const officeId = req.user.officeId;

  const { data, error } = await supabase
    .from("meetings")
    .select(
      `
      id,
      title,
      start_time,
      duration_minutes,
      want_room,
      requested_by (
        id,
        name,
        office
      )
    `
    )
    .eq("status", "approved");

  if (error) return res.status(500).json({ error });
  const filtered = data.filter((m) => m.requested_by.office === officeId);

  res.status(200).json(filtered);
};

const getAvailableRooms = async (req, res) => {
  const { meeting_id } = req.query;

  const { data: meeting, error: meetingErr } = await supabase
    .from("meetings")
    .select("start_time, duration_minutes, requested_by ( office )")
    .eq("id", meeting_id)
    .single();

  if (meetingErr || !meeting) {
    return res.status(400).json({ error: "Invalid meeting ID" });
  }

  const officeId = meeting.requested_by.office;

  const newStartTime = new Date(meeting.start_time);
  const endTime = new Date(
    newStartTime.getTime() + meeting.duration_minutes * 60000
  );

  const { data: rooms } = await supabase
    .from("conference_room")
    .select("id, name")
    .eq("office_id", officeId);

  const roomIds = rooms.map((r) => r.id);

  const { data: meetings } = await supabase
    .from("meetings")
    .select("conference_room_id, start_time, duration_minutes")
    .eq("status", "approved")
    .in("conference_room_id", roomIds);

  const busyRoomIds = new Set();

  meetings.forEach((m) => {
    const mStart = new Date(m.start_time);
    const mEnd = new Date(mStart.getTime() + m.duration_minutes * 60000);
    const overlap = !(mEnd <= newStartTime || mStart >= endTime);
    if (overlap) busyRoomIds.add(m.conference_room_id);
  });

  const available = rooms.filter((r) => !busyRoomIds.has(r.id));
  res.json(available);
};

const approveMeeting = async (req, res) => {
  const { meeting_id, room_id } = req.body;

  const { data: meeting, error } = await supabase
    .from("meetings")
    .select("*")
    .eq("id", meeting_id)
    .single();

  if (error || !meeting) {
    return res.status(404).json({ message: "Meeting not found" });
  }

  const start = new Date(meeting.start_time);
  const end = new Date(start.getTime() + meeting.duration_minutes * 60000);

  // Check which licenses are busy during this time
  const { data: all } = await supabase
    .from("meetings")
    .select("license, start_time, duration_minutes")
    .eq("status", "approved");

  const busyLicenses = new Set();
  all.forEach((m) => {
    const s = new Date(m.start_time);
    const e = new Date(s.getTime() + m.duration_minutes * 60000);
    if (!(e <= start || s >= end)) busyLicenses.add(m.license);
  });

  let assignedLicense = 1;
  if (busyLicenses.has(1)) {
    if (busyLicenses.has(2)) {
      return res.status(400).json({ message: "No license available" });
    } else {
      assignedLicense = 2;
    }
  }

  if (meeting.want_room && !room_id) {
    return res
      .status(400)
      .json({ message: "Room is required for this meeting" });
  }

  const meeting_link = `https://webex.com/meet/${Math.random()
    .toString(36)
    .substring(2, 10)}`;

  const { error: updateError } = await supabase
    .from("meetings")
    .update({
      license: assignedLicense,
      conference_room_id: meeting.want_room ? room_id : null,
      status: "approved",
      link: meeting_link,
    })
    .eq("id", meeting_id);

  if (updateError)
    return res.status(500).json({ message: "Failed to approve" });

  res.json({ success: true, message: "Meeting approved" });
};

const rejectMeeting = async (req, res) => {
  const { meeting_id } = req.body;

  // Step 1: Update meeting status to "rejected"
  const { error: updateError } = await supabase
    .from("meetings")
    .update({ status: "rejected" })
    .eq("id", meeting_id);

  if (updateError) {
    return res.status(500).json({ message: "Failed to reject meeting" });
  }

  // Step 2: Delete related participants
  const { error: deleteError } = await supabase
    .from("meeting_participants")
    .delete()
    .eq("meeting_id", meeting_id);

  if (deleteError) {
    return res
      .status(500)
      .json({ message: "Meeting rejected, but failed to remove participants" });
  }

  res.json({
    success: true,
    message: "Meeting rejected and participants removed",
  });
};

async function checkLicense(officeId, newStartTime, endTime) {
  try {
    const { data: officeLicenses, error: licenseError } = await supabase
      .from("licenses")
      .select("id")
      .eq("office_id", officeId);

    if (licenseError || !officeLicenses || officeLicenses.length === 0) {
      return null; // no license available
    }

    const licenseIds = officeLicenses.map((l) => l.id);

    const { data: meetings, error: meetingError } = await supabase
      .from("meetings")
      .select("license, start_time, duration_minutes")
      .eq("status", "approved")
      .in("license", licenseIds);

    if (meetingError) return null;

    // Find the first license that is free
    for (let license of licenseIds) {
      const overlapping = meetings.some(
        (m) =>
          m.license === license &&
          !(
            new Date(m.start_time).getTime() +
              (m.duration_minutes || 60) * 60000 <=
              newStartTime.getTime() ||
            new Date(m.start_time).getTime() >= endTime.getTime()
          )
      );
      if (!overlapping) return license;
    }

    return null; // no free license
  } catch (error) {
    console.error("ERROR in getAvailableLicense:", error);
    return null;
  }
}

// Check if any room is available in the requested time slot
async function checkRoom(officeId, newStartTime, endTime) {
  try {
    const { data: rooms, error: roomError } = await supabase
      .from("conference_room")
      .select("id")
      .eq("office_id", officeId);

    if (roomError || !rooms || rooms.length === 0) return null;

    const roomIds = rooms.map((r) => r.id);

    const { data: meetings, error: meetingError } = await supabase
      .from("meetings")
      .select("conference_room_id, start_time, duration_minutes")
      .eq("status", "approved")
      .in("conference_room_id", roomIds);

    if (meetingError) return null;

    for (let roomId of roomIds) {
      const overlapping = meetings.some(
        (m) =>
          m.conference_room_id === roomId &&
          !(
            new Date(m.start_time).getTime() + m.duration_minutes * 60000 <=
              newStartTime.getTime() ||
            new Date(m.start_time).getTime() >= endTime.getTime()
          )
      );
      if (!overlapping) return roomId;
    }

    return null;
  } catch (error) {
    console.error("ERROR in getAvailableRoom:", error);
    return null;
  }
}

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
  const newStartTime = new Date(start_time);
  const endTime = new Date(newStartTime.getTime() + duration_minutes * 60000);

  // 1️⃣ Get an available license
  const licenseId = await getAvailableLicense(officeId, newStartTime, endTime);
  if (!licenseId) {
    return res
      .status(400)
      .json({ success: false, message: "❌ No Webex license available." });
  }

  // 2️⃣ Get an available room (if requested)
  let roomId = null;
  if (want_room) {
    roomId = await getAvailableRoom(officeId, newStartTime, endTime);
    if (!roomId) {
      return res
        .status(400)
        .json({ success: false, message: "❌ No conference room available." });
    }
  }

  // 3️⃣ Insert meeting as APPROVED
  const { data: insertedMeeting, error: insertError } = await supabase
    .from("meetings")
    .insert([
      {
        title,
        description,
        start_time,
        duration_minutes,
        requested_by: userId,
        status: "approved",
        conference_room_id: roomId,
        license: licenseId,
        link: "GENERATED_LINK_HERE", // generate if needed
        want_room,
      },
    ])
    .select()
    .single();

  if (insertError) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to insert meeting." });
  }

  // 4️⃣ Add participants
  if (Array.isArray(participants) && participants.length > 0) {
    const participantRows = participants
      .map((id) => Number(id))
      .filter((id) => !isNaN(id))
      .map((user_id) => ({ meeting_id: insertedMeeting.id, user_id }));

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
  }

  return res.status(200).json({
    success: true,
    message: "✅ Meeting scheduled and approved.",
    meeting: insertedMeeting,
  });
};
module.exports = {
  getPendingRequests,
  getAvailableRooms,
  approveMeeting,
  rejectMeeting,
  getApprovedMeeting,
  getCancelledMeetings,
};
