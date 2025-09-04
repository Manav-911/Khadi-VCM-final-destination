const express = require("express");
const router = express.Router();
const {
  getAllMeetings,
  getMeetingById,
  createMeeting, // <-- NEW
} = require("../controllers/eventsController");
const { authenticateToken } = require("../middleware/authMiddleware");

// Read-only
router.get("/", getAllMeetings);
router.get("/:id", getMeetingById);

// Write route (for form submission)
router.post("/create", authenticateToken, createMeeting); // <-- NEW

module.exports = router;
