const express = require("express");
const {
  addMeeting,
  getApprovedMeetingUser,
  getOffices,
  getUsersByOffice,
  getUsers,
  cancelUserMeeting,
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

module.exports = meetingRouter;
