const express = require("express");
const router = express.Router();
const { applyForInternship, getApplications, getApplication, updateApplicationStatus, withdrawApplication } = require("../controllers/applicationController");
const { authenticateUser, authorizeRole } = require("../middleware/auth");
const upload = require("../middleware/upload");

router.get("/", authenticateUser, getApplications);
router.get("/:id", authenticateUser, getApplication);
router.post("/", authenticateUser, authorizeRole("student"), upload.single("resume"), applyForInternship);
router.put("/:id/status", authenticateUser, updateApplicationStatus);
router.put("/:id/withdraw", authenticateUser, authorizeRole("student"), withdrawApplication);

module.exports = router;
