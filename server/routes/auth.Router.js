const express = require('express');
const { userLogin, adminLogin } = require('../controllers/auth.controller.js');

const authRouter = express.Router();

authRouter.post("/user", userLogin);
authRouter.post("/admin", adminLogin)

module.exports = authRouter;