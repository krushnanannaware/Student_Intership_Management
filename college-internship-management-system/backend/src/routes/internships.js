const express = require("express");
const router = express.Router();
const { getInternships, getInternship, createInternship, updateInternship, approveInternship, archiveInternship } = require("../controllers/internshipController");
const { authenticateUser, authorizeRole } = require("../middleware/auth");

router.get("/", authenticateUser, getInternships);
router.get("/:id", authenticateUser, getInternship);
router.post("/", authenticateUser, authorizeRole("admin","faculty"), createInternship);
router.put("/:id/approve", authenticateUser, authorizeRole("admin"), approveInternship);
router.put("/:id/archive", authenticateUser, authorizeRole("admin","faculty"), archiveInternship);
router.put("/:id", authenticateUser, authorizeRole("admin","faculty"), updateInternship);

module.exports = router;
