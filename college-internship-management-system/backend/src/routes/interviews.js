const express = require("express");
const router = express.Router();
const { getInterviews, scheduleInterview, updateInterview, cancelInterview } = require("../controllers/interviewController");
const { authenticateUser, authorizeRole } = require("../middleware/auth");

router.get("/", authenticateUser, getInterviews);
router.post("/", authenticateUser, authorizeRole("admin","faculty"), scheduleInterview);
router.put("/:id", authenticateUser, authorizeRole("admin","faculty"), updateInterview);
router.delete("/:id", authenticateUser, authorizeRole("admin","faculty"), cancelInterview);

module.exports = router;
