const pool = require("../config/db");
const path = require("path");

const applyForInternship = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { internship_id, cover_letter, qualifications } = req.body;

    // ── Validate required fields ──
    if (!cover_letter || !cover_letter.trim()) {
      conn.release();
      return res.status(400).json({ success: false, message: "Cover letter is required." });
    }
    if (cover_letter.trim().length < 50) {
      conn.release();
      return res.status(400).json({ success: false, message: "Cover letter must be at least 50 characters." });
    }
    if (!qualifications || !qualifications.trim()) {
      conn.release();
      return res.status(400).json({ success: false, message: "Qualifications & Skills are required." });
    }
    if (qualifications.trim().length < 20) {
      conn.release();
      return res.status(400).json({ success: false, message: "Please describe your qualifications in at least 20 characters." });
    }

    // Get student id
    const [students] = await conn.query("SELECT id FROM students WHERE user_id=?", [req.user.id]);
    if (!students.length) return res.status(403).json({ success: false, message: "Student profile not found" });
    const studentId = students[0].id;

    // Check duplicate (also enforced by DB UNIQUE constraint)
    const [dup] = await conn.query("SELECT id FROM applications WHERE student_id=? AND internship_id=?", [studentId, internship_id]);
    if (dup.length) return res.status(409).json({ success: false, message: "You have already applied for this internship." });

    // Check internship availability
    const [intern] = await conn.query("SELECT * FROM internships WHERE id=?", [internship_id]);
    if (!intern.length) return res.status(404).json({ success: false, message: "Internship not found" });
    if (intern[0].status !== "approved") return res.status(400).json({ success: false, message: "Internship is not open for applications" });
    if (new Date(intern[0].application_deadline) < new Date()) return res.status(400).json({ success: false, message: "Application deadline has passed" });

    // Get student resume or use uploaded
    const [studentRow] = await conn.query("SELECT resume_path FROM students WHERE id=?", [studentId]);
    const resumePath = req.file ? req.file.path.replace(/\\/g, "/") : (studentRow[0].resume_path || "");
    if (!resumePath) return res.status(400).json({ success: false, message: "Please upload a resume (PDF)" });

    const [result] = await conn.query(
      "INSERT INTO applications (student_id,internship_id,cover_letter,qualifications,resume_path) VALUES (?,?,?,?,?)",
      [studentId, internship_id, cover_letter, qualifications, resumePath]);

    // Save resume on student profile too
    if (req.file) {
      await conn.query("UPDATE students SET resume_path=? WHERE id=?", [resumePath, studentId]);
    }

    await conn.query("INSERT INTO activity_logs (user_id,action,entity_type,entity_id,details) VALUES (?,?,?,?,?)",
      [req.user.id, "APPLICATION_CREATED", "application", result.insertId, `Applied to internship ID: ${internship_id}`]);

    res.status(201).json({ success: true, message: "Application submitted successfully", data: { id: result.insertId } });
  } catch (err) {
    console.error(err);
    if (err.code === "ER_DUP_ENTRY") return res.status(409).json({ success: false, message: "You have already applied for this internship." });
    res.status(500).json({ success: false, message: "Failed to submit application" });
  } finally { conn.release(); }
};

const getApplications = async (req, res) => {
  try {
    const { status, internship_id, student_id, page = 1, limit = 20 } = req.query;
    let sql = `SELECT a.*, s.full_name AS student_name, s.enrollment_no, s.gpa,
               i.title AS internship_title, i.domain, i.duration_weeks, i.stipend,
               c.name AS company_name,
               u2.full_name AS reviewer_name
               FROM applications a
               JOIN students s ON a.student_id=s.id
               JOIN internships i ON a.internship_id=i.id
               JOIN companies c ON i.company_id=c.id
               LEFT JOIN users ru ON a.reviewed_by=ru.id
               LEFT JOIN faculty u2 ON ru.id=u2.user_id
               WHERE 1=1`;
    const params = [];
    if (req.user.role === "student") {
      const [st] = await pool.query("SELECT id FROM students WHERE user_id=?", [req.user.id]);
      sql += " AND a.student_id=?"; params.push(st[0]?.id);
    } else if (req.user.role === "faculty") {
      const [myInterns] = await pool.query("SELECT id FROM internships WHERE created_by=?", [req.user.id]);
      if (myInterns.length) {
        sql += ` AND a.internship_id IN (${myInterns.map(() => "?").join(",")})`;
        params.push(...myInterns.map(i => i.id));
      } else { return res.json({ success: true, data: [], total: 0 }); }
    }
    if (status) { sql += " AND a.status=?"; params.push(status); }
    if (internship_id) { sql += " AND a.internship_id=?"; params.push(internship_id); }
    if (student_id && req.user.role !== "student") { sql += " AND a.student_id=?"; params.push(student_id); }
    sql += " ORDER BY a.applied_at DESC";
    const offset = (parseInt(page)-1)*parseInt(limit);
    sql += ` LIMIT ${parseInt(limit)} OFFSET ${offset}`;
    const [rows] = await pool.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: "Failed to fetch applications" }); }
};


const getApplication = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT a.*, s.full_name AS student_name, s.enrollment_no, s.gpa, s.phone, u.email AS student_email,
       i.title AS internship_title, i.domain, i.stipend, i.duration_weeks,
       c.name AS company_name, d.name AS department_name
       FROM applications a
       JOIN students s ON a.student_id=s.id
       JOIN users u ON s.user_id=u.id
       JOIN internships i ON a.internship_id=i.id
       JOIN companies c ON i.company_id=c.id
       JOIN departments d ON s.department_id=d.id
       WHERE a.id=?`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: "Application not found" });
    if (req.user.role === "student") {
      const [st] = await pool.query("SELECT id FROM students WHERE user_id=?", [req.user.id]);
      if (rows[0].student_id !== st[0]?.id) return res.status(403).json({ success: false, message: "Access denied" });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) { res.status(500).json({ success: false, message: "Failed to fetch application" }); }
};

const updateApplicationStatus = async (req, res) => {
  try {
    const { status, review_notes } = req.body;
    const valid = ["pending","shortlisted","rejected","accepted","withdrawn"];
    if (!valid.includes(status)) return res.status(400).json({ success: false, message: "Invalid status" });

    // Students can only withdraw their own
    if (req.user.role === "student") {
      if (status !== "withdrawn") return res.status(403).json({ success: false, message: "Students can only withdraw applications" });
      const [st] = await pool.query("SELECT id FROM students WHERE user_id=?", [req.user.id]);
      const [app] = await pool.query("SELECT student_id FROM applications WHERE id=?", [req.params.id]);
      if (!app.length || app[0].student_id !== st[0]?.id) return res.status(403).json({ success: false, message: "Access denied" });
    }

    await pool.query(
      "UPDATE applications SET status=?, reviewed_by=?, reviewed_at=NOW(), review_notes=? WHERE id=?",
      [status, req.user.id, review_notes, req.params.id]);

    if (status === "accepted") {
      await pool.query(
        `UPDATE students s JOIN applications a ON a.student_id=s.id
         SET s.placement_status="placed" WHERE a.id=?`, [req.params.id]);
    }

    // Notify student
    const [app] = await pool.query(
      `SELECT s.user_id, i.title FROM applications a JOIN students s ON a.student_id=s.id
       JOIN internships i ON a.internship_id=i.id WHERE a.id=?`, [req.params.id]);
    if (app.length) {
      await pool.query(
        "INSERT INTO notifications (user_id,title,message,type) VALUES (?,?,?,?)",
        [app[0].user_id, `Application ${status}`,
         `Your application for "${app[0].title}" has been ${status}.`,
         status==="accepted"?"success":status==="rejected"?"error":"info"]);
    }

    await pool.query("INSERT INTO activity_logs (user_id,action,entity_type,entity_id,details) VALUES (?,?,?,?,?)",
      [req.user.id,"APPLICATION_STATUS","application",req.params.id,`Status: ${status}`]);

    res.json({ success: true, message: "Application status updated" });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: "Failed to update application status" }); }
};

const withdrawApplication = async (req, res) => {
  try {
    const [st] = await pool.query("SELECT id FROM students WHERE user_id=?", [req.user.id]);
    const [app] = await pool.query("SELECT * FROM applications WHERE id=? AND student_id=?", [req.params.id, st[0]?.id]);
    if (!app.length) return res.status(403).json({ success: false, message: "Application not found or access denied" });
    if (["accepted","rejected"].includes(app[0].status)) {
      return res.status(400).json({ success: false, message: "Cannot withdraw an already " + app[0].status + " application" });
    }
    await pool.query("UPDATE applications SET status='withdrawn' WHERE id=?", [req.params.id]);
    res.json({ success: true, message: "Application withdrawn" });
  } catch (err) { res.status(500).json({ success: false, message: "Failed to withdraw application" }); }
};

module.exports = { applyForInternship, getApplications, getApplication, updateApplicationStatus, withdrawApplication };
