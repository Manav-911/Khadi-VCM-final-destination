const express = require('express');
const router = express.Router();
const {
  getAllMeetings,
  getMeetingById
} = require('../controllers/eventsController');

// Read-only routes
router.get('/', getAllMeetings);
router.get('/:id', getMeetingById);

module.exports = router;