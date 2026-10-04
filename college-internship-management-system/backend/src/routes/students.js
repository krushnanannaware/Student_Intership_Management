const express = require("express");
const router = express.Router();
const { getStudents, getStudent, getMyProfile, updateStudent, deactivateStudent, getStudentDashboard } = require("../controllers/studentController");
const { authenticateUser, authorizeRole } = require("../middleware/auth");
const upload = require("../middleware/upload");

router.get("/dashboard", authenticateUser, authorizeRole("student"), getStudentDashboard);
router.get("/my-profile", authenticateUser, authorizeRole("student"), getMyProfile);
router.get("/", authenticateUser, authorizeRole("admin","faculty"), getStudents);
router.get("/:id", authenticateUser, getStudent);
router.put("/:id", authenticateUser, upload.single("resume"), updateStudent);
router.delete("/:id", authenticateUser, authorizeRole("admin"), deactivateStudent);

module.exports = router;
