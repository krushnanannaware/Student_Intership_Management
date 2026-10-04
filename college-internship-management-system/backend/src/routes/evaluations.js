const express = require("express");
const router = express.Router();
const { getEvaluations, createEvaluation, updateEvaluation } = require("../controllers/evaluationController");
const { authenticateUser, authorizeRole } = require("../middleware/auth");

router.get("/", authenticateUser, getEvaluations);
router.post("/", authenticateUser, authorizeRole("admin","faculty"), createEvaluation);
router.put("/:id", authenticateUser, authorizeRole("admin","faculty"), updateEvaluation);

module.exports = router;
