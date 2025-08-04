const express = require('express');
const router = express.Router();
const {
  getAllMeetings,
  getMeetingById,
  createMeeting  // <-- NEW
} = require('../controllers/eventsController');

// Read-only
router.get('/', getAllMeetings);
router.get('/:id', getMeetingById);

// Write route (for form submission)
router.post('/', createMeeting);  // <-- NEW

module.exports = router;
