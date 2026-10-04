const pool = require("../config/db");

const getCompanies = async (req, res) => {
  try {
    const { search, industry, page = 1, limit = 20 } = req.query;
    let sql = "SELECT c.*, u.email AS created_by_email FROM companies c JOIN users u ON c.created_by=u.id WHERE c.is_active=1";
    const params = [];
    if (search) { sql += " AND (c.name LIKE ? OR c.location LIKE ?)"; params.push(`%${search}%`, `%${search}%`); }
    if (industry) { sql += " AND c.industry = ?"; params.push(industry); }
    sql += " ORDER BY c.created_at DESC";
    const offset = (parseInt(page) - 1) * parseInt(limit);
    sql += ` LIMIT ${parseInt(limit)} OFFSET ${offset}`;
    const [rows] = await pool.query(sql, params);
    const [count] = await pool.query("SELECT COUNT(*) AS total FROM companies WHERE is_active=1");
    res.json({ success: true, data: rows, total: count[0].total });
  } catch (err) { res.status(500).json({ success: false, message: "Failed to fetch companies" }); }
};

const getCompany = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM companies WHERE id = ?", [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: "Company not found" });
    const [internships] = await pool.query(
      "SELECT id, title, domain, status, application_deadline FROM internships WHERE company_id=? ORDER BY created_at DESC",
      [req.params.id]);
    const [ratings] = await pool.query(
      `SELECT AVG(sf.avg_rating) AS avg_rating, COUNT(sf.id) AS total_reviews
       FROM student_feedback sf JOIN applications a ON sf.application_id=a.id
       JOIN internships i ON a.internship_id=i.id WHERE i.company_id=?`,
      [req.params.id]);
    res.json({ success: true, data: { ...rows[0], internships, ratings: ratings[0] } });
  } catch (err) { res.status(500).json({ success: false, message: "Failed to fetch company" }); }
};

const createCompany = async (req, res) => {
  try {
    const { name, registration_number, industry, location, website, contact_person, contact_email, contact_phone, description } = req.body;
    const [exists] = await pool.query("SELECT id FROM companies WHERE registration_number=?", [registration_number]);
    if (exists.length) return res.status(409).json({ success: false, message: "Company with this registration number already exists" });
    const [result] = await pool.query(
      `INSERT INTO companies (name,registration_number,industry,location,website,contact_person,contact_email,contact_phone,description,created_by)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [name, registration_number, industry, location, website, contact_person, contact_email, contact_phone, description, req.user.id]);

    // ── Notify all active students and faculty ──
    const [recipients] = await pool.query(
      "SELECT id FROM users WHERE role IN ('student','faculty') AND is_active=1"
    );
    if (recipients.length > 0) {
      const notifValues = recipients.map(u => [
        u.id,
        "🏢 New Company Added!",
        `${name} (${industry}) has joined the platform. Check available internships!`,
        "info"
      ]);
      await pool.query(
        "INSERT INTO notifications (user_id, title, message, type) VALUES ?",
        [notifValues]
      );
    }

    res.status(201).json({ success: true, message: "Company created", data: { id: result.insertId } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to create company" });
  }
};

const updateCompany = async (req, res) => {
  try {
    const { name, industry, location, website, contact_person, contact_email, contact_phone, description } = req.body;
    await pool.query(
      `UPDATE companies SET name=?,industry=?,location=?,website=?,contact_person=?,contact_email=?,contact_phone=?,description=?
       WHERE id=?`,
      [name, industry, location, website, contact_person, contact_email, contact_phone, description, req.params.id]);
    res.json({ success: true, message: "Company updated" });
  } catch (err) { res.status(500).json({ success: false, message: "Failed to update company" }); }
};

const archiveCompany = async (req, res) => {
  try {
    await pool.query("UPDATE companies SET is_active=0 WHERE id=?", [req.params.id]);
    res.json({ success: true, message: "Company archived" });
  } catch (err) { res.status(500).json({ success: false, message: "Failed to archive company" }); }
};

module.exports = { getCompanies, getCompany, createCompany, updateCompany, archiveCompany };
