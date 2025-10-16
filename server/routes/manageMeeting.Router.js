const supabase = require("../config/db.js");
const express = require("express");

const {
  authenticateToken,
  isAdmin,
} = require("../middleware/authMiddleware.js");

const {
  getPendingRequests,
  getAvailableRooms,
  approveMeeting,
  rejectMeeting,
  getCancelledMeetings,
  getApprovedMeeting,
  getAvailableLicenses,
  getCompletedMeetings,
} = require("../controllers/manageMeeting.controller.js");

const manageMeetingRouter = express.Router();

manageMeetingRouter.get(
  "/pending-request",
  authenticateToken,
  isAdmin,
  getPendingRequests
);

manageMeetingRouter.get(
  "/available-rooms",
  authenticateToken,
  isAdmin,
  getAvailableRooms
);

manageMeetingRouter.post(
  "/approve-meeting",
  authenticateToken,
  isAdmin,
  approveMeeting
);

manageMeetingRouter.post(
  "/reject-meeting",
  authenticateToken,
  isAdmin,
  rejectMeeting
);

manageMeetingRouter.get(
  "/rejectedcancelled-meetings",
  authenticateToken,
  isAdmin,
  getCancelledMeetings
);

manageMeetingRouter.get(
  "/approved-meetings",
  authenticateToken,
  isAdmin,
  getApprovedMeeting
);

manageMeetingRouter.get(
  "/completed-meetings",
  authenticateToken,
  isAdmin,
  getCompletedMeetings
);

manageMeetingRouter.get(
  "/available-licenses",
  authenticateToken,
  isAdmin,
  getAvailableLicenses
);

module.exports = manageMeetingRouter;
