const express = require("express");
const router  = express.Router();
const { register, login, getMe, changePassword } = require("../controllers/authController");
const { requestOTP, verifyOTP, resetPassword }   = require("../controllers/forgotPasswordController");
const { authenticateUser } = require("../middleware/auth");

// Existing routes
router.post("/register",        register);
router.post("/login",           login);
router.get("/me",               authenticateUser, getMe);
router.put("/change-password",  authenticateUser, changePassword);

// Forgot-password OTP flow
router.post("/forgot-password/request-otp",   requestOTP);
router.post("/forgot-password/verify-otp",    verifyOTP);
router.post("/forgot-password/reset-password", resetPassword);

module.exports = router;
