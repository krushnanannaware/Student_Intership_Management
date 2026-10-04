const pool = require("../config/db");

const getStudents = async (req, res) => {
  try {
    const { department, search, placement_status, page = 1, limit = 20 } = req.query;
    let sql = `SELECT s.*, u.email, u.is_active, u.created_at as user_created, d.name AS department_name
               FROM students s
               JOIN users u ON s.user_id = u.id
               JOIN departments d ON s.department_id = d.id
               WHERE s.is_active = 1`;
    const params = [];
    if (department) { sql += " AND s.department_id = ?"; params.push(department); }
    if (placement_status) { sql += " AND s.placement_status = ?"; params.push(placement_status); }
    if (search) {
      sql += " AND (s.full_name LIKE ? OR s.enrollment_no LIKE ? OR u.email LIKE ?)";
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    sql += " ORDER BY s.created_at DESC";
    const offset = (parseInt(page) - 1) * parseInt(limit);
    sql += ` LIMIT ${parseInt(limit)} OFFSET ${offset}`;
    const [rows] = await pool.query(sql, params);
    const [countResult] = await pool.query(
      "SELECT COUNT(*) AS total FROM students s JOIN users u ON s.user_id=u.id WHERE s.is_active=1",
      []
    );
    res.json({ success: true, data: rows, total: countResult[0].total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to fetch students" });
  }
};

const getStudent = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT s.*, u.email, d.name AS department_name FROM students s
       JOIN users u ON s.user_id = u.id JOIN departments d ON s.department_id = d.id
       WHERE s.id = ?`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: "Student not found" });
    // Access control: students can only view their own profile
    if (req.user.role === "student") {
      const [mine] = await pool.query("SELECT id FROM students WHERE user_id = ?", [req.user.id]);
      if (!mine.length || mine[0].id !== parseInt(req.params.id)) {
        return res.status(403).json({ success: false, message: "Access denied" });
      }
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch student" });
  }
};

const getMyProfile = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT s.*, u.email, d.name AS department_name FROM students s
       JOIN users u ON s.user_id = u.id JOIN departments d ON s.department_id = d.id
       WHERE s.user_id = ?`, [req.user.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: "Profile not found" });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch profile" });
  }
};

const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, phone, department_id, gpa, year_of_study } = req.body;
    // Students can only update their own profile
    if (req.user.role === "student") {
      const [mine] = await pool.query("SELECT id FROM students WHERE user_id = ?", [req.user.id]);
      if (!mine.length || mine[0].id !== parseInt(id)) {
        return res.status(403).json({ success: false, message: "Access denied" });
      }
    }
    const updates = {};
    if (full_name) updates.full_name = full_name;
    if (phone) updates.phone = phone;
    if (department_id) updates.department_id = department_id;
    if (gpa !== undefined) updates.gpa = gpa;
    if (year_of_study) updates.year_of_study = year_of_study;
    if (req.file) updates.resume_path = req.file.path.replace(/\\/g, "/");

    if (!Object.keys(updates).length) {
      return res.status(400).json({ success: false, message: "No fields to update" });
    }
    const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(", ");
    await pool.query(`UPDATE students SET ${setClauses} WHERE id = ?`, [...Object.values(updates), id]);
    res.json({ success: true, message: "Student updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to update student" });
  }
};

const deactivateStudent = async (req, res) => {
  try {
    await pool.query("UPDATE students SET is_active = 0 WHERE id = ?", [req.params.id]);
    await pool.query("UPDATE users u JOIN students s ON u.id = s.user_id SET u.is_active = 0 WHERE s.id = ?", [req.params.id]);
    res.json({ success: true, message: "Student deactivated (soft delete)" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to deactivate student" });
  }
};

const getStudentDashboard = async (req, res) => {
  try {
    const [studentRows] = await pool.query("SELECT id FROM students WHERE user_id = ?", [req.user.id]);
    if (!studentRows.length) return res.status(404).json({ success: false, message: "Student not found" });
    const studentId = studentRows[0].id;
    const [stats] = await pool.query(
      `SELECT
        COUNT(*) AS total_applications,
        SUM(status="pending") AS pending,
        SUM(status="shortlisted") AS shortlisted,
        SUM(status="accepted") AS accepted,
        SUM(status="rejected") AS rejected
       FROM applications WHERE student_id = ?`, [studentId]);
    const [recentApps] = await pool.query(
      `SELECT a.id, a.status, a.applied_at, i.title, c.name AS company
       FROM applications a JOIN internships i ON a.internship_id=i.id JOIN companies c ON i.company_id=c.id
       WHERE a.student_id = ? ORDER BY a.applied_at DESC LIMIT 5`, [studentId]);
    const [upcomingInterviews] = await pool.query(
      `SELECT iv.*, i.title AS internship_title, c.name AS company_name
       FROM interviews iv JOIN applications a ON iv.application_id=a.id
       JOIN internships i ON a.internship_id=i.id JOIN companies c ON i.company_id=c.id
       WHERE a.student_id=? AND iv.interview_date >= CURDATE() AND iv.is_cancelled=0
       ORDER BY iv.interview_date LIMIT 3`, [studentId]);
    const [notifications] = await pool.query(
      "SELECT * FROM notifications WHERE user_id=? AND is_read=0 ORDER BY created_at DESC LIMIT 5",
      [req.user.id]);
    res.json({ success: true, data: { stats: stats[0], recentApplications: recentApps, upcomingInterviews, notifications } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to load dashboard" });
  }
};

module.exports = { getStudents, getStudent, getMyProfile, updateStudent, deactivateStudent, getStudentDashboard };
