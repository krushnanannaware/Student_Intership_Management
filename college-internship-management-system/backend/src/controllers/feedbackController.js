const pool = require("../config/db");

// Student Feedback
const submitStudentFeedback = async (req, res) => {
  try {
    const { application_id, company_culture, mentorship_quality, technical_learning, work_environment, overall_experience, comments, suggestions, is_anonymous } = req.body;
    const [st] = await pool.query("SELECT id FROM students WHERE user_id=?", [req.user.id]);
    const [app] = await pool.query("SELECT * FROM applications WHERE id=? AND student_id=?", [application_id, st[0]?.id]);
    if (!app.length) return res.status(403).json({ success: false, message: "Access denied or application not found" });
    const [dup] = await pool.query("SELECT id FROM student_feedback WHERE application_id=?", [application_id]);
    if (dup.length) return res.status(409).json({ success: false, message: "Feedback already submitted for this application" });
    const [result] = await pool.query(
      `INSERT INTO student_feedback (application_id,company_culture,mentorship_quality,technical_learning,work_environment,overall_experience,comments,suggestions,is_anonymous)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [application_id, company_culture, mentorship_quality, technical_learning, work_environment, overall_experience, comments, suggestions, is_anonymous||0]);
    res.status(201).json({ success: true, message: "Feedback submitted", data: { id: result.insertId } });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: "Failed to submit feedback" }); }
};

const getStudentFeedback = async (req, res) => {
  try {
    let sql = `SELECT sf.*, c.name AS company_name, i.title AS internship_title,
               IF(sf.is_anonymous=1, "Anonymous", s.full_name) AS student_name
               FROM student_feedback sf
               JOIN applications a ON sf.application_id=a.id
               JOIN students s ON a.student_id=s.id
               JOIN internships i ON a.internship_id=i.id
               JOIN companies c ON i.company_id=c.id WHERE 1=1`;
    const params = [];
    if (req.user.role === "student") {
      const [st] = await pool.query("SELECT id FROM students WHERE user_id=?", [req.user.id]);
      sql += " AND a.student_id=?"; params.push(st[0]?.id);
    }
    sql += " ORDER BY sf.created_at DESC";
    const [rows] = await pool.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: "Failed to fetch feedback" }); }
};

// Faculty Feedback
const submitFacultyFeedback = async (req, res) => {
  try {
    const { internship_id, suitability, course_alignment, student_learning, internship_quality, improvement_suggestions } = req.body;
    const [fac] = await pool.query("SELECT id FROM faculty WHERE user_id=?", [req.user.id]);
    if (!fac.length) return res.status(403).json({ success: false, message: "Faculty profile not found" });
    const [dup] = await pool.query("SELECT id FROM faculty_feedback WHERE internship_id=? AND faculty_id=?", [internship_id, fac[0].id]);
    if (dup.length) return res.status(409).json({ success: false, message: "Feedback already submitted for this internship" });
    const [result] = await pool.query(
      "INSERT INTO faculty_feedback (internship_id,faculty_id,suitability,course_alignment,student_learning,internship_quality,improvement_suggestions) VALUES (?,?,?,?,?,?,?)",
      [internship_id, fac[0].id, suitability, course_alignment, student_learning, internship_quality, improvement_suggestions]);
    res.status(201).json({ success: true, message: "Faculty feedback submitted", data: { id: result.insertId } });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: "Failed to submit feedback" }); }
};

const getFacultyFeedback = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT ff.*, i.title AS internship_title, c.name AS company_name, f.full_name AS faculty_name
       FROM faculty_feedback ff JOIN internships i ON ff.internship_id=i.id
       JOIN companies c ON i.company_id=c.id JOIN faculty f ON ff.faculty_id=f.id
       ORDER BY ff.created_at DESC`);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: "Failed to fetch faculty feedback" }); }
};

// System Feedback
const submitSystemFeedback = async (req, res) => {
  try {
    const { category, title, description, priority } = req.body;
    const [result] = await pool.query(
      "INSERT INTO system_feedback (user_id,category,title,description,priority) VALUES (?,?,?,?,?)",
      [req.user.id, category, title, description, priority||"medium"]);
    res.status(201).json({ success: true, message: "System feedback submitted", data: { id: result.insertId } });
  } catch (err) { res.status(500).json({ success: false, message: "Failed to submit system feedback" }); }
};

const getSystemFeedback = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT sf.*, u.email AS user_email, u.role AS user_role FROM system_feedback sf
       JOIN users u ON sf.user_id=u.id ORDER BY sf.created_at DESC`);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: "Failed to fetch system feedback" }); }
};

const updateSystemFeedbackStatus = async (req, res) => {
  try {
    const { status, admin_notes } = req.body;
    await pool.query("UPDATE system_feedback SET status=?, admin_notes=? WHERE id=?", [status, admin_notes, req.params.id]);
    res.json({ success: true, message: "System feedback updated" });
  } catch (err) { res.status(500).json({ success: false, message: "Failed to update feedback" }); }
};

module.exports = { submitStudentFeedback, getStudentFeedback, submitFacultyFeedback, getFacultyFeedback, submitSystemFeedback, getSystemFeedback, updateSystemFeedbackStatus };
