const express = require("express");
const {
  addMeeting,
  getApprovedMeetingUser,
  getOffices,
  getUsersByOffice,
  getUsers,
  cancelUserMeeting,
  requestMeetingRecording,
  getMeetingAttendance,
} = require("../controllers/meeting.controller");
const { authenticateToken } = require("../middleware/authMiddleware.js");
const supabase = require("../config/db.js");

const meetingRouter = express.Router();

meetingRouter.post("/requestMeeting", authenticateToken, addMeeting);
meetingRouter.get(
  "/approved_meetings",
  authenticateToken,
  getApprovedMeetingUser
);
meetingRouter.get("/getOffices", authenticateToken, getOffices);
meetingRouter.get(
  "/getUsersByOffice/:office",
  authenticateToken,
  getUsersByOffice
);
meetingRouter.get("/getUsers", authenticateToken, getUsers);
meetingRouter.delete(
  "/cancelUserMeeting/:id",
  authenticateToken,
  cancelUserMeeting
);
meetingRouter.post(
  "/request-recording/:meetingId",
  authenticateToken,
  requestMeetingRecording
);

meetingRouter.get(
  "/get-meeting-attendance/:meeting_id",
  authenticateToken,
  getMeetingAttendance
);

module.exports = meetingRouter;
