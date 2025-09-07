const express = require("express");
const { authenticateToken, isAdmin } = require("../middleware/authMiddleware");
const {
  getAllUsersOfOffice,
  addUser,
  deleteUser,
} = require("../controllers/manageUser.controller");

const manageUserRouter = express.Router();

manageUserRouter.get(
  "/getUsers",
  authenticateToken,
  isAdmin,
  getAllUsersOfOffice
);

manageUserRouter.post("/addUser", authenticateToken, isAdmin, addUser);

manageUserRouter.delete("/deleteUser", authenticateToken, isAdmin, deleteUser);

module.exports = manageUserRouter;
