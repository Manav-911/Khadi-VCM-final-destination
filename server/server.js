const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const authRouter = require("./routes/auth.Router.js");
const meetingRouter = require("./routes/meeting.Router.js");
const manageMeetingRouter = require("./routes/manageMeeting.Router.js");
const manageUserRouter = require("./routes/manageUser.Router.js");
const client = require("./config/new_db.js");
dotenv.config();
const app = express();
app.use(express.json());

app.use(
  cors({
    origin: [
      "http://localhost:5173", // User frontend
      "http://localhost:5174", // Admin frontend
    ], // ✅ match your React frontend URL exactly
    credentials: true, // ✅ allow sending/receiving cookies or headers
  })
);
const port = process.env.PORT || 3000;
app.use("/login", authRouter);
app.use("/meeting", meetingRouter);
app.use("/admin", manageMeetingRouter);
app.use("/manageUser", manageUserRouter);
app.get("/oauth/callback", async (req, res) => {
  const { code } = req.query;
  console.log("Authorization code:", code);

  // Exchange code for access + refresh token
  // (use axios POST to https://webexapis.com/v1/access_token)

  res.send("Authorization successful! You can close this page.");
});
app.listen(port, () => {
  console.log(`Server listning on PORT ${port}`);
});
