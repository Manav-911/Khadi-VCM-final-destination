const express = require("express");
const { addMeeting } = require("../controllers/meeting.controller");
const { authenticateToken } = require("../middleware/authMiddleware.js");

const meetingRouter = express.Router();

meetingRouter.post("/requestMeeting", authenticateToken, addMeeting);

module.exports = meetingRouter;
