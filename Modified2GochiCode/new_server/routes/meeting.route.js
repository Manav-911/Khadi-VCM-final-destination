const express = require("express");
const cors = require("cors");
const pool = require("../dbTemp.js")
const app = express();
const router = express.Router();

router.post('/request', async(req, res)=>{
    const { title, date, time, duration, participants, description, status } = req.body;
    try{
        const result = await pool.query(
        `INSERT INTO req_meet_table (meeting_title, date, time, duration, participants, meeting_desc, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [title, date, time, duration, participants, description, 'PENDING']
    );
    res.status(201).json({ message: 'Meeting request saved', data: result.rows[0] });
    }
    catch (err) {
    console.error('DB Error:', err);
    res.status(500).json({ error: 'Database insert failed' });
    }
});

router.get('/request/approve', async (req, res) => {
  try {
    const result = await pool.query(`SELECT id, meeting_title, participants, TO_CHAR(date, 'YYYY-MM-DD') AS date, status, time FROM req_meet_table WHERE status='APPROVED'`);
    res.status(200).json(result.rows);
    console.log('data fetched : ',result);
  } catch (err) {
    console.error('Error fetching meetings:', err);
    res.status(500).json({ error: 'Failed to fetch meetings' });
  }
});

router.get('/request/decline', async (req, res) => {
  try {
    const result = await pool.query(`SELECT id, meeting_title, participants, TO_CHAR(date, 'YYYY-MM-DD') AS date, status, time FROM req_meet_table WHERE status='DECLINED'`);
    res.status(200).json(result.rows);
    console.log('data fetched : ',result);
  } catch (err) {
    console.error('Error fetching meetings:', err);
    res.status(500).json({ error: 'Failed to fetch meetings' });
  }
});

router.get('/request/pending', async (req, res) => {
  try {
    const result = await pool.query(`SELECT id, meeting_title, participants, TO_CHAR(date, 'YYYY-MM-DD') AS date, status, time FROM req_meet_table WHERE status='PENDING'`);
    res.status(200).json(result.rows);
    console.log('data fetched : ',result);
  } catch (err) {
    console.error('Error fetching meetings:', err);
    res.status(500).json({ error: 'Failed to fetch meetings' });
  }
});

// Approve meeting
router.post('/approve', async (req, res) => {
  const { id } = req.body;
  try {
    await pool.query(
      `UPDATE req_meet_table SET status = 'APPROVED' WHERE id = $1`,
      [id]
    );
    res.json({ message: 'Meeting approved' });
  } catch (err) {
    console.error('Error approving meeting:', err);
    res.status(500).json({ error: 'Failed to approve meeting' });
  }
});

// Decline meeting
router.post('/decline', async (req, res) => {
  const { id } = req.body;
  try {
    await pool.query(
      `UPDATE req_meet_table SET status = 'DECLINED' WHERE id = $1`,
      [id]
    );
    res.json({ message: 'Meeting declined' });
  } catch (err) {
    console.error('Error declining meeting:', err);
    res.status(500).json({ error: 'Failed to decline meeting' });
  }
});


module.exports = router;