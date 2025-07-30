const express = require('express');
const router = express.Router();
const {
  getAllMeetings,
  getMeetingById,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  getAvailableRooms
} = require('../controllers/eventsController');

// Routes
router.get('/', getAllMeetings);
router.get('/available-rooms', getAvailableRooms);
router.get('/:id', getMeetingById);
router.post('/', createMeeting);
router.put('/:id', updateMeeting);
router.delete('/:id', deleteMeeting);

module.exports = router;