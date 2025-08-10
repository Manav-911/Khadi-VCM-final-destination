require('dotenv').config();
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const pool = require("./dbTemp");
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");
const jwt = require('jsonwebtoken');
const routeRegLogin = require('./routes/auth.route.js');
const meetingRoute = require('./routes/meeting.route.js');
const meetingRouteEve = require('./routes/events.js');
const authRouter = require('./routes/auth.Router.js');


const app = express();

dotenv.config();

app.use(cookieParser());
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

app.post('/api', routeRegLogin);
app.use('/api', meetingRoute);
app.use("/api/meetings", meetingRouteEve);

app.use('/login', authRouter);
app.use("/api/meetings", meetingRoute);


app.listen(5000, () => {
    console.log("Server Has Started on Port 5000")
}); 