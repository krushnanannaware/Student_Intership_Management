const express = require("express");
const router = express.Router();
const { submitStudentFeedback, getStudentFeedback, submitFacultyFeedback, getFacultyFeedback, submitSystemFeedback, getSystemFeedback, updateSystemFeedbackStatus } = require("../controllers/feedbackController");
const { authenticateUser, authorizeRole } = require("../middleware/auth");

router.post("/student", authenticateUser, authorizeRole("student"), submitStudentFeedback);
router.get("/student", authenticateUser, getStudentFeedback);
router.post("/faculty", authenticateUser, authorizeRole("faculty","admin"), submitFacultyFeedback);
router.get("/faculty", authenticateUser, authorizeRole("admin","faculty"), getFacultyFeedback);
router.post("/system", authenticateUser, submitSystemFeedback);
router.get("/system", authenticateUser, authorizeRole("admin"), getSystemFeedback);
router.put("/system/:id", authenticateUser, authorizeRole("admin"), updateSystemFeedbackStatus);

module.exports = router;
