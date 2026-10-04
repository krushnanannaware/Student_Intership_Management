require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");

// Import routes
const authRoutes        = require("./routes/auth");
const studentRoutes     = require("./routes/students");
const companyRoutes     = require("./routes/companies");
const internshipRoutes  = require("./routes/internships");
const applicationRoutes = require("./routes/applications");
const interviewRoutes   = require("./routes/interviews");
const evaluationRoutes  = require("./routes/evaluations");
const feedbackRoutes    = require("./routes/feedback");
const adminRoutes       = require("./routes/admin");
const errorHandler      = require("./middleware/errorHandler");
const app = express();

// Security & logging middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Health check
app.get("/api/health", (req, res) => res.json({ success: true, message: "College IMS API is running", timestamp: new Date() }));

// API Routes
app.use("/api/auth",         authRoutes);
app.use("/api/students",     studentRoutes);
app.use("/api/companies",    companyRoutes);
app.use("/api/internships",  internshipRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/interviews",   interviewRoutes);
app.use("/api/evaluations",  evaluationRoutes);
app.use("/api/feedback",     feedbackRoutes);
app.use("/api/admin",        adminRoutes);

// 404 handler
app.use("/{*splat}", (req, res) => res.status(404).json({ success: false, message: "Route not found" }));

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 College IMS Backend running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🌐 CORS allowed for: ${process.env.FRONTEND_URL || "http://localhost:5173"}`);
});

module.exports = app;
