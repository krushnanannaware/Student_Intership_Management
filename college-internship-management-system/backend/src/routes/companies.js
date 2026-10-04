const express = require("express");
const router = express.Router();
const { getCompanies, getCompany, createCompany, updateCompany, archiveCompany } = require("../controllers/companyController");
const { authenticateUser, authorizeRole } = require("../middleware/auth");

router.get("/", authenticateUser, getCompanies);
router.get("/:id", authenticateUser, getCompany);
router.post("/", authenticateUser, authorizeRole("admin"), createCompany);
router.put("/:id", authenticateUser, authorizeRole("admin"), updateCompany);
router.delete("/:id", authenticateUser, authorizeRole("admin"), archiveCompany);

module.exports = router;
