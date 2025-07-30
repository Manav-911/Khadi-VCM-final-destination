const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser"); // ✅ required
const authRouter = require("./routes/auth.Router.js");
const meetingRoutes = require("./routes/events.js"); // adjust if path is different

dotenv.config();
const app = express();
app.use(express.json());
app.use(cookieParser()); // ✅ must be before route handlers

// ✅ Enable credentials & restrict origin
app.use(cors({
  origin: "http://localhost:5173", // your frontend
  credentials: true,
}));

const port = process.env.PORT || 3000;

app.use("/login", authRouter);
app.use("/api/meetings", meetingRoutes);

app.listen(port, () => {
  console.log(`Server listning on PORT ${port}`);
});
