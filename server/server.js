const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const authRouter = require("./routes/auth.Router.js");
dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());
const port = process.env.PORT || 3000;
app.use("/login", authRouter);
app.listen(port, () => {
  console.log(`Server listning on PORT ${port}`);
});
