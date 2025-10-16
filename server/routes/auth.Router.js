const express = require('express');
const { userLogin, adminLogin } = require('../controllers/auth.controller.js');
// IMPORTANT: Corrected the import path and included both functions from the password reset controller
const { forgotPassword, resetPassword } = require('../controllers/forgot.controller.js'); 

const authRouter = express.Router();

// Existing Login Routes
authRouter.post("/user", userLogin);
authRouter.post("/admin", adminLogin);

// Forgot Password Request (Step 1: Initiates email sending)
authRouter.post("/forgot-password", forgotPassword);

// Password Reset Confirmation (Step 2: Handles token validation and password update)
// The frontend (NewPassword.jsx) POSTs the token and new password to this route.
authRouter.post("/reset-password", resetPassword);

module.exports = authRouter;
