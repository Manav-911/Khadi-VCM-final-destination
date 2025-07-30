require('dotenv').config();
const express = require("express");
const cors = require("cors");
const pool = require("./db");
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const routeRegLogin = require('./routes/auth.route.js');
const meetingRoute = require('./routes/meeting.route.js');

const app = express();

//middleware
app.use(cors());
app.use(express.json());



//Register New User
app.post('/api', routeRegLogin);
app.use('/api', meetingRoute);

//app.post("/api/request", meetingRoute);
app.use("/api/meetings", meetingRoute);


//////////////////////////MEETING REQUESTS////////////////////////////////////////
// const { title, date, startTime, endTime, description } = req.body;

// app.post("/meetings", async (req, res) => {
//     await db.query(
//         `INSERT INTO meetings (title, start_time, end_time, description)
//    VALUES ($1, $2, $3, $4)`,
//         [title, startTime, endTime, description]
//     );
// });




//////////////////////////SHHHHHH ITS LISTENING/////////////////////////////////
app.listen(5000, () => {
    console.log("Server Has Started on Port 5000")
}); 