const pool = require("../config/db");

const getAdminDashboard = async (req, res) => {
  try {
    const [[stats]] = await pool.query(`SELECT
      (SELECT COUNT(*) FROM students WHERE is_active=1) AS total_students,
      (SELECT COUNT(*) FROM faculty WHERE is_active=1) AS total_faculty,
      (SELECT COUNT(*) FROM companies WHERE is_active=1) AS total_companies,
      (SELECT COUNT(*) FROM internships WHERE status != "archived") AS total_internships,
      (SELECT COUNT(*) FROM applications) AS total_applications,
      (SELECT COUNT(*) FROM applications WHERE status="accepted") AS accepted_applications,
      (SELECT COUNT(*) FROM applications WHERE status="rejected") AS rejected_applications,
      (SELECT COUNT(*) FROM applications WHERE status="pending") AS pending_applications,
      (SELECT COUNT(*) FROM applications WHERE status="shortlisted") AS shortlisted_applications,
      (SELECT COUNT(*) FROM interviews WHERE is_cancelled=0) AS total_interviews,
      (SELECT ROUND(SUM(placement_status="placed")*100.0/NULLIF(COUNT(*),0),2) FROM students WHERE is_active=1) AS placement_rate,
      (SELECT COALESCE(AVG(stipend),0) FROM internships WHERE status="approved") AS avg_stipend`);

    const [appByStatus] = await pool.query(
      `SELECT status, COUNT(*) AS count FROM applications GROUP BY status`);
    const [appByDomain] = await pool.query(
      `SELECT i.domain, COUNT(a.id) AS count FROM applications a
       JOIN internships i ON a.internship_id=i.id GROUP BY i.domain ORDER BY count DESC LIMIT 10`);
    const [placementByDept] = await pool.query(
      `SELECT d.name AS department, COUNT(s.id) AS total,
       SUM(s.placement_status="placed") AS placed
       FROM students s JOIN departments d ON s.department_id=d.id
       WHERE s.is_active=1 GROUP BY d.id, d.name`);
    const [recentActivity] = await pool.query(
      `SELECT al.*, u.email FROM activity_logs al LEFT JOIN users u ON al.user_id=u.id
       ORDER BY al.created_at DESC LIMIT 10`);
    const [topCompanies] = await pool.query(
      `SELECT c.name, COUNT(a.id) AS applications, SUM(a.status="accepted") AS hired
       FROM companies c LEFT JOIN internships i ON c.id=i.company_id
       LEFT JOIN applications a ON i.id=a.internship_id
       GROUP BY c.id, c.name ORDER BY applications DESC LIMIT 5`);

    res.json({ success: true, data: { stats, appByStatus, appByDomain, placementByDept, recentActivity, topCompanies } });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: "Failed to load admin dashboard" }); }
};

const getFacultyDashboard = async (req, res) => {
  try {
    const [myInternships] = await pool.query(
      `SELECT i.id, i.title, i.status, i.domain, c.name AS company_name,
       COUNT(a.id) AS applications FROM internships i JOIN companies c ON i.company_id=c.id
       LEFT JOIN applications a ON i.id=a.internship_id
       WHERE i.created_by=? GROUP BY i.id ORDER BY i.created_at DESC LIMIT 5`, [req.user.id]);
    const [[appStats]] = await pool.query(
      `SELECT COUNT(*) AS total, SUM(a.status="pending") AS pending,
       SUM(a.status="shortlisted") AS shortlisted, SUM(a.status="accepted") AS accepted,
       SUM(a.status="rejected") AS rejected
       FROM applications a JOIN internships i ON a.internship_id=i.id WHERE i.created_by=?`, [req.user.id]);
    const [upcomingInterviews] = await pool.query(
      `SELECT iv.*, s.full_name AS student_name, i.title AS internship_title
       FROM interviews iv JOIN applications a ON iv.application_id=a.id
       JOIN students s ON a.student_id=s.id JOIN internships i ON a.internship_id=i.id
       WHERE iv.scheduled_by=? AND iv.interview_date >= CURDATE() AND iv.is_cancelled=0
       ORDER BY iv.interview_date LIMIT 5`, [req.user.id]);
    const [pendingApps] = await pool.query(
      `SELECT a.id, s.full_name, i.title, a.applied_at FROM applications a
       JOIN students s ON a.student_id=s.id JOIN internships i ON a.internship_id=i.id
       WHERE i.created_by=? AND a.status="pending" ORDER BY a.applied_at LIMIT 5`, [req.user.id]);

    // All students with their application history — faculty view (no admin-only fields)
    const [allStudentApplications] = await pool.query(
      `SELECT
         s.id AS student_id, s.full_name, s.enrollment_no, s.gpa,
         d.name AS department_name,
         u.email AS student_email,
         a.id AS application_id, a.status AS app_status, a.applied_at, a.review_notes,
         i.id AS internship_id, i.title AS internship_title, i.domain, i.duration_weeks, i.stipend,
         i.requirements AS required_skills,
         c.name AS company_name
       FROM students s
       JOIN users u ON s.user_id = u.id
       JOIN departments d ON s.department_id = d.id
       LEFT JOIN applications a ON a.student_id = s.id
       LEFT JOIN internships i ON a.internship_id = i.id
       LEFT JOIN companies c ON i.company_id = c.id
       WHERE s.is_active = 1
       ORDER BY s.full_name ASC, a.applied_at DESC`);

    res.json({ success: true, data: { myInternships, appStats, upcomingInterviews, pendingApps, allStudentApplications } });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: "Failed to load faculty dashboard" }); }
};

const getAdminReport = async (req, res) => {
  try {
    const [placementSummary] = await pool.query("SELECT * FROM placement_summary");
    const [internshipStats] = await pool.query("SELECT * FROM internship_statistics WHERE status != 'archived' ORDER BY total_applications DESC");
    const [companyStats] = await pool.query("SELECT * FROM company_statistics ORDER BY total_applications DESC");
    const [studentEvals] = await pool.query("SELECT * FROM student_evaluation_summary ORDER BY avg_overall_score DESC LIMIT 20");
    const [activityLogs] = await pool.query(
      `SELECT al.*, u.email FROM activity_logs al LEFT JOIN users u ON al.user_id=u.id
       ORDER BY al.created_at DESC LIMIT 50`);
    res.json({ success: true, data: { placementSummary, internshipStats, companyStats, studentEvals, activityLogs } });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: "Failed to generate admin report" }); }
};

const getFacultyReport = async (req, res) => {
  try {
    const [summary] = await pool.query("SELECT * FROM faculty_application_summary WHERE faculty_id = (SELECT id FROM faculty WHERE user_id=?)", [req.user.id]);
    const [myInternships] = await pool.query(
      `SELECT i.*, c.name AS company_name, COUNT(a.id) AS applications,
       SUM(a.status="shortlisted") AS shortlisted, SUM(a.status="accepted") AS accepted
       FROM internships i JOIN companies c ON i.company_id=c.id
       LEFT JOIN applications a ON i.id=a.internship_id
       WHERE i.created_by=? GROUP BY i.id ORDER BY i.created_at DESC`, [req.user.id]);
    const [interviews] = await pool.query(
      `SELECT iv.result, COUNT(*) AS count FROM interviews iv WHERE iv.scheduled_by=? GROUP BY iv.result`, [req.user.id]);
    res.json({ success: true, data: { summary: summary[0], myInternships, interviews } });
  } catch (err) { res.status(500).json({ success: false, message: "Failed to generate faculty report" }); }
};

const getStudentReport = async (req, res) => {
  try {
    const [st] = await pool.query("SELECT id FROM students WHERE user_id=?", [req.user.id]);
    if (!st.length) return res.status(404).json({ success: false, message: "Student not found" });
    const studentId = st[0].id;
    const [[appSummary]] = await pool.query(
      `SELECT COUNT(*) AS total, SUM(status="pending") AS pending, SUM(status="shortlisted") AS shortlisted,
       SUM(status="accepted") AS accepted, SUM(status="rejected") AS rejected
       FROM applications WHERE student_id=?`, [studentId]);
    const [timeline] = await pool.query(
      `SELECT a.id, a.status, a.applied_at, a.reviewed_at, i.title, c.name AS company, i.stipend
       FROM applications a JOIN internships i ON a.internship_id=i.id JOIN companies c ON i.company_id=c.id
       WHERE a.student_id=? ORDER BY a.applied_at DESC`, [studentId]);
    const [interviews] = await pool.query(
      `SELECT iv.*, i.title, c.name AS company FROM interviews iv
       JOIN applications a ON iv.application_id=a.id JOIN internships i ON a.internship_id=i.id
       JOIN companies c ON i.company_id=c.id WHERE a.student_id=? ORDER BY iv.interview_date DESC`, [studentId]);
    const [evals] = await pool.query(
      `SELECT e.*, i.title FROM evaluations e JOIN applications a ON e.application_id=a.id
       JOIN internships i ON a.internship_id=i.id WHERE a.student_id=? AND e.is_archived=0`, [studentId]);
    res.json({ success: true, data: { appSummary, timeline, interviews, evals } });
  } catch (err) { res.status(500).json({ success: false, message: "Failed to generate student report" }); }
};

const getUsers = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.email, u.role, u.is_active, u.last_login, u.created_at,
       COALESCE(s.full_name, f.full_name) AS full_name,
       COALESCE(s.enrollment_no, f.employee_id) AS identifier
       FROM users u
       LEFT JOIN students s ON u.id=s.user_id
       LEFT JOIN faculty f ON u.id=f.user_id
       ORDER BY u.created_at DESC`);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: "Failed to fetch users" }); }
};

const toggleUserStatus = async (req, res) => {
  try {
    const { is_active } = req.body;
    await pool.query("UPDATE users SET is_active=? WHERE id=?", [is_active, req.params.id]);
    res.json({ success: true, message: `User ${is_active ? "activated" : "deactivated"}` });
  } catch (err) { res.status(500).json({ success: false, message: "Failed to update user status" }); }
};

const getDepartments = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM departments ORDER BY name");
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: "Failed to fetch departments" }); }
};

const getNotifications = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 50",
      [req.user.id]);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: "Failed to fetch notifications" }); }
};

const markNotificationRead = async (req, res) => {
  try {
    await pool.query("UPDATE notifications SET is_read=1 WHERE user_id=? AND id=?",
      [req.user.id, req.params.id]);
    res.json({ success: true, message: "Notification marked as read" });
  } catch (err) { res.status(500).json({ success: false, message: "Failed to update notification" }); }
};

const markAllNotificationsRead = async (req, res) => {
  try {
    await pool.query("UPDATE notifications SET is_read=1 WHERE user_id=?", [req.user.id]);
    res.json({ success: true, message: "All notifications marked as read" });
  } catch (err) { res.status(500).json({ success: false, message: "Failed to update notifications" }); }
};

// Admin: get all applications with filters
const getAllApplicationsAdmin = async (req, res) => {
  try {
    const { status, company_id, internship_id, domain, student_search, page = 1, limit = 50 } = req.query;
    let sql = `SELECT
      a.id, a.status, a.applied_at, a.review_notes, a.reviewed_at,
      s.id AS student_id, s.full_name AS student_name, s.enrollment_no, s.phone AS student_phone,
      u.email AS student_email,
      i.id AS internship_id, i.title AS internship_title, i.domain, i.duration_weeks, i.stipend,
      c.id AS company_id, c.name AS company_name
      FROM applications a
      JOIN students s ON a.student_id = s.id
      JOIN users u ON s.user_id = u.id
      JOIN internships i ON a.internship_id = i.id
      JOIN companies c ON i.company_id = c.id
      WHERE 1=1`;
    const params = [];
    if (status && status !== 'all') { sql += " AND a.status=?"; params.push(status); }
    if (company_id) { sql += " AND c.id=?"; params.push(company_id); }
    if (internship_id) { sql += " AND i.id=?"; params.push(internship_id); }
    if (domain) { sql += " AND i.domain=?"; params.push(domain); }
    if (student_search) {
      sql += " AND (s.full_name LIKE ? OR u.email LIKE ? OR s.enrollment_no LIKE ?)";
      params.push(`%${student_search}%`, `%${student_search}%`, `%${student_search}%`);
    }
    sql += " ORDER BY a.applied_at DESC";
    const offset = (parseInt(page)-1)*parseInt(limit);
    sql += ` LIMIT ${parseInt(limit)} OFFSET ${offset}`;
    const [rows] = await pool.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: "Failed to fetch applications" }); }
};

// Faculty sends a skill suggestion to a specific student
// Stored as a 'warning' notification so student sees it in their bell + dashboard
const sendSkillSuggestion = async (req, res) => {
  try {
    if (req.user.role !== "faculty") return res.status(403).json({ success: false, message: "Only faculty can send skill suggestions" });

    const { student_user_id, suggestion, internship_title, company_name } = req.body;
    if (!student_user_id) return res.status(400).json({ success: false, message: "Student is required." });
    if (!suggestion || !suggestion.trim()) return res.status(400).json({ success: false, message: "Suggestion text is required." });
    if (suggestion.trim().length < 5) return res.status(400).json({ success: false, message: "Suggestion must be at least 5 characters." });

    // Verify target is an active student
    const [target] = await pool.query("SELECT id, role FROM users WHERE id=? AND is_active=1", [student_user_id]);
    if (!target.length || target[0].role !== "student") return res.status(404).json({ success: false, message: "Student not found." });

    // Get faculty name
    const [fac] = await pool.query("SELECT full_name FROM faculty WHERE user_id=?", [req.user.id]);
    const facultyName = fac[0]?.full_name || "Faculty";

    const notifTitle = `📚 Skill Suggestion from ${facultyName}`;
    const contextLine = internship_title ? `\nInternship: ${internship_title}${company_name ? ` @ ${company_name}` : ""}` : "";
    const notifMessage = `${suggestion.trim()}${contextLine}`;

    await pool.query(
      "INSERT INTO notifications (user_id, title, message, type) VALUES (?,?,?,?)",
      [student_user_id, notifTitle, notifMessage, "warning"]
    );
    await pool.query(
      "INSERT INTO activity_logs (user_id,action,entity_type,entity_id,details) VALUES (?,?,?,?,?)",
      [req.user.id, "SKILL_SUGGESTION_SENT", "user", student_user_id, `Suggestion: ${suggestion.trim().slice(0, 100)}`]
    );
    res.json({ success: true, message: "Skill suggestion sent to student successfully." });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: "Failed to send suggestion" }); }
};

// Get all skill suggestions sent by the logged-in faculty (via activity_logs)
const getFacultySuggestions = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT al.created_at, al.details, u.email AS student_email,
       COALESCE(s.full_name, u.email) AS student_name, s.enrollment_no
       FROM activity_logs al
       JOIN users u ON al.entity_id = u.id
       LEFT JOIN students s ON s.user_id = u.id
       WHERE al.user_id=? AND al.action='SKILL_SUGGESTION_SENT'
       ORDER BY al.created_at DESC LIMIT 50`,
      [req.user.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: "Failed to fetch suggestions" }); }
};

module.exports = { getAdminDashboard, getFacultyDashboard, getAdminReport, getFacultyReport, getStudentReport, getUsers, toggleUserStatus, getDepartments, getNotifications, markNotificationRead, markAllNotificationsRead, getAllApplicationsAdmin, sendSkillSuggestion, getFacultySuggestions };

