require('dotenv').config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');

const app = require('express');
const router = express.Router();

router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await pool.query("INSERT INTO userdata (name, email, password) VALUES($1, $2, $3) RETURNING *",
            [name, email, hashedPassword]);

        const token = jwt.sign({
            userId: newUser.rows[0].id,
            name: newUser.rows[0].name,
            email: newUser.rows[0].email
        },
            process.env.JWT_SECRET
        );

        res.status(201).json({
            success: true,
            message: 'Registered AND logged in!',
            token: token, // Frontend will store this
            user: {
                userId: newUser.rows[0].id,
                name: newUser.rows[0].name,
                email: newUser.rows[0].email
            }
        });



    } catch (err) {
        console.log(err.message);
        res.status(500).json("Server error");
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {

        //get credentials 
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        //find user
        const user = await pool.query("SELECT * FROM userdata WHERE email = $1", [email]);

        //check if user exists
        if (user.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'E-mail or Password is Incorrect!'
            });
        }

        //compare passwords
        const validPassword = await bcrypt.compare(password, user.rows[0].password);
        if (!validPassword) {
            return res.status(401).json({
                success: false,
                message: 'E-mail or Password is Incorrect!'
            });
        }

        //create JWT token
        const token = jwt.sign({
            userId: user.rows[0].id,
            name: user.rows[0].name,
            email: user.rows[0].email
        },
            process.env.JWT_SECRET
        );

        //success response
        res.json({
            success: true,
            message: 'Logged in successfully!',
            token: token,
            user: {
                userId: user.rows[0].id,
                name: user.rows[0].name,
                email: user.rows[0].email
            }
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }

});

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
    const result = await pool.query(`SELECT * FROM req_meet_table WHERE status='APPROVED'`);
    res.status(200).json(result.rows);
    console.log('data fetched : ',result);
  } catch (err) {
    console.error('Error fetching meetings:', err);
    res.status(500).json({ error: 'Failed to fetch meetings' });
  }
});

router.get('/request/decline', async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM req_meet_table WHERE status='DECLINED'`);
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