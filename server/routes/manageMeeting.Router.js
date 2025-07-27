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

module.exports = manageMeetingRouter;
