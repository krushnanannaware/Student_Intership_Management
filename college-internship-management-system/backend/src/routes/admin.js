const express = require("express");
const router = express.Router();
const { getAdminDashboard, getFacultyDashboard, getAdminReport, getFacultyReport, getStudentReport, getUsers, toggleUserStatus, getDepartments, getNotifications, markNotificationRead, markAllNotificationsRead, getAllApplicationsAdmin, sendSkillSuggestion, getFacultySuggestions } = require("../controllers/adminController");
const { authenticateUser, authorizeRole } = require("../middleware/auth");

router.get("/dashboard", authenticateUser, authorizeRole("admin"), getAdminDashboard);
router.get("/faculty-dashboard", authenticateUser, authorizeRole("faculty"), getFacultyDashboard);
router.get("/reports/admin", authenticateUser, authorizeRole("admin"), getAdminReport);
router.get("/reports/faculty", authenticateUser, authorizeRole("faculty","admin"), getFacultyReport);
router.get("/reports/student", authenticateUser, authorizeRole("student"), getStudentReport);
router.get("/users", authenticateUser, authorizeRole("admin"), getUsers);
router.put("/users/:id/status", authenticateUser, authorizeRole("admin"), toggleUserStatus);
router.get("/departments", getDepartments); // Public: needed for student registration form
router.get("/notifications", authenticateUser, getNotifications);
router.put("/notifications/:id/read", authenticateUser, markNotificationRead);
router.put("/notifications/read-all", authenticateUser, markAllNotificationsRead);
router.get("/applications", authenticateUser, authorizeRole("admin"), getAllApplicationsAdmin);
router.post("/skill-suggestions", authenticateUser, authorizeRole("faculty"), sendSkillSuggestion);
router.get("/skill-suggestions", authenticateUser, authorizeRole("faculty"), getFacultySuggestions);

module.exports = router;

