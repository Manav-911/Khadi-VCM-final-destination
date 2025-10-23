const express = require("express");
const {
  requestPasswordReset,
  resetPassword,
} = require("../controllers/resetPass.controller.js");
const resetPassRouter = express.Router();

resetPassRouter.post("/request", requestPasswordReset);
resetPassRouter.post("/reset", resetPassword);

module.exports = resetPassRouter;
