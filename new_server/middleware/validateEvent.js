// This file is not needed for read-only calendar
// But keeping it in case you need it for your separate request form

const validateMeeting = (req, res, next) => {
  const { title, start_time, duration_minutes, requested_by } = req.body;

  // Check required fields
  if (!title || !start_time) {
    return res.status(400).json({
      error: 'Missing required fields: title and start_time are required'
    });
  }

  // Validate title
  if (typeof title !== 'string' || title.trim().length === 0) {
    return res.status(400).json({
      error: 'Title must be a non-empty string'
    });
  }

  // Validate start_time
  const startDate = new Date(start_time);
  if (isNaN(startDate.getTime())) {
    return res.status(400).json({
      error: 'Invalid date format for start_time'
    });
  }

  // Validate duration_minutes if provided
  if (duration_minutes !== undefined) {
    if (!Number.isInteger(duration_minutes) || duration_minutes <= 0) {
      return res.status(400).json({
        error: 'duration_minutes must be a positive integer'
      });
    }
  }

  // Validate requested_by if provided
  if (requested_by !== undefined && (!Number.isInteger(requested_by) || requested_by <= 0)) {
    return res.status(400).json({
      error: 'requested_by must be a valid user ID'
    });
  }

  // Check if meeting is in the past
  if (startDate < new Date()) {
    return res.status(400).json({
      error: 'Cannot schedule meetings in the past'
    });
  }

  // Sanitize title
  req.body.title = title.trim();

  next();
};

const validateMeetingUpdate = (req, res, next) => {
  const { title, start_time, duration_minutes, status } = req.body;

  // Validate title if provided
  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({
        error: 'Title must be a non-empty string'
      });
    }
    req.body.title = title.trim();
  }

  // Validate start_time if provided
  if (start_time !== undefined) {
    const startDate = new Date(start_time);
    if (isNaN(startDate.getTime())) {
      return res.status(400).json({
        error: 'Invalid date format for start_time'
      });
    }
  }

  // Validate duration_minutes if provided
  if (duration_minutes !== undefined) {
    if (!Number.isInteger(duration_minutes) || duration_minutes <= 0) {
      return res.status(400).json({
        error: 'duration_minutes must be a positive integer'
      });
    }
  }

  // Validate status if provided
  if (status !== undefined) {
    const validStatuses = ['pending', 'approved', 'rejected', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }
  }

  next();
};

module.exports = { validateMeeting, validateMeetingUpdate };