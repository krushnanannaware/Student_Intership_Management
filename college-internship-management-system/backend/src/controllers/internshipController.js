const pool = require("../config/db");

const getInternships = async (req, res) => {
  try {
    const { domain, company_id, location, min_stipend, status, search, page = 1, limit = 20 } = req.query;
    let sql = `SELECT i.*, c.name AS company_name, c.industry, c.location AS company_location,
               u.email AS created_by_email,
               (SELECT COUNT(*) FROM applications a WHERE a.internship_id=i.id) AS application_count
               FROM internships i JOIN companies c ON i.company_id=c.id JOIN users u ON i.created_by=u.id
               WHERE c.is_active=1`;
    const params = [];
    if (req.user.role === "student") {
      sql += " AND i.status='approved'";
      // Exclude internships the student has already applied to
      const [st] = await pool.query("SELECT id FROM students WHERE user_id=?", [req.user.id]);
      if (st.length) {
        sql += " AND i.id NOT IN (SELECT internship_id FROM applications WHERE student_id=?)";
        params.push(st[0].id);
      }
    } else if (req.user.role === "faculty") {
      // Faculty "Post Internship" management page: my_only=true → show only their own internships at any status
      // Faculty "Browse Internships" page: my_only not set → show all approved internships
      const my_only = req.query.my_only === "true";
      if (my_only) {
        sql += " AND i.created_by=?"; params.push(req.user.id);
        if (status) { sql += " AND i.status=?"; params.push(status); }
        // No status filter when my_only — show all statuses (pending, approved, archived)
      } else {
        // Browse all approved internships
        if (status) { sql += " AND i.status=?"; params.push(status); }
        else { sql += " AND i.status='approved'"; }
      }
    } else if (status) { sql += " AND i.status=?"; params.push(status); }
    if (domain) { sql += " AND i.domain=?"; params.push(domain); }
    if (company_id) { sql += " AND i.company_id=?"; params.push(company_id); }
    if (location) { sql += " AND (i.location LIKE ? OR c.location LIKE ?)"; params.push(`%${location}%`,`%${location}%`); }
    if (min_stipend) { sql += " AND i.stipend>=?"; params.push(min_stipend); }
    if (search) { sql += " AND (i.title LIKE ? OR i.description LIKE ?)"; params.push(`%${search}%`,`%${search}%`); }
    sql += " ORDER BY i.created_at DESC";
    const offset = (parseInt(page)-1)*parseInt(limit);
    sql += ` LIMIT ${parseInt(limit)} OFFSET ${offset}`;
    const [rows] = await pool.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: "Failed to fetch internships" }); }
};

const getInternship = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT i.*, c.name AS company_name, c.industry, c.location AS company_location,
       c.contact_person, c.contact_email, c.website,
       u.email AS created_by_email,
       (SELECT COUNT(*) FROM applications a WHERE a.internship_id=i.id) AS application_count
       FROM internships i JOIN companies c ON i.company_id=c.id JOIN users u ON i.created_by=u.id
       WHERE i.id=?`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: "Internship not found" });
    res.json({ success: true, data: rows[0] });
  } catch (err) { res.status(500).json({ success: false, message: "Failed to fetch internship" }); }
};

const createInternship = async (req, res) => {
  try {
    const { company_id, title, description, domain, location, duration_weeks, stipend,
            vacancies, start_date, end_date, application_deadline, requirements } = req.body;

    // Backend validation for required fields
    if (!company_id) return res.status(400).json({ success: false, message: "Company name is required." });
    if (!title || !title.trim()) return res.status(400).json({ success: false, message: "Internship title is required." });
    if (!duration_weeks) return res.status(400).json({ success: false, message: "Internship duration is required." });
    const dw = parseInt(duration_weeks);
    if (!dw || dw < 4 || dw > 26) return res.status(400).json({ success: false, message: "Duration must be between 4 and 26 weeks." });
    if (stipend === undefined || stipend === null || stipend === "") return res.status(400).json({ success: false, message: "Stipend is required." });
    if (!domain || !domain.trim()) return res.status(400).json({ success: false, message: "Domain is required." });
    if (!requirements || !requirements.trim()) return res.status(400).json({ success: false, message: "Required skills are required." });
    if (!description || !description.trim()) return res.status(400).json({ success: false, message: "Description is required." });
    if (!location || !location.trim()) return res.status(400).json({ success: false, message: "Location is required." });
    if (!start_date || !end_date || !application_deadline) return res.status(400).json({ success: false, message: "All dates are required." });

    const [result] = await pool.query(
      `INSERT INTO internships (company_id,title,description,domain,location,duration_weeks,stipend,vacancies,
       start_date,end_date,application_deadline,requirements,created_by)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [company_id, title.trim(), description.trim(), domain.trim(), location.trim(), dw, parseFloat(stipend)||0,
       vacancies||1, start_date, end_date, application_deadline, requirements.trim(), req.user.id]);
    await pool.query(
      "INSERT INTO activity_logs (user_id,action,entity_type,entity_id,details) VALUES (?,?,?,?,?)",
      [req.user.id, "INTERNSHIP_CREATED", "internship", result.insertId, `Created: ${title}`]);
    res.status(201).json({ success: true, message: "Internship created (pending approval)", data: { id: result.insertId } });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: "Failed to create internship", error: err.message }); }
};

const updateInternship = async (req, res) => {
  try {
    const { title, description, domain, location, duration_weeks, stipend, vacancies,
            start_date, end_date, application_deadline, requirements } = req.body;

    // Validate mandatory fields
    if (!title || !title.trim()) return res.status(400).json({ success: false, message: "Internship title is required." });
    if (!duration_weeks) return res.status(400).json({ success: false, message: "Duration is required." });
    const dw = parseInt(duration_weeks);
    if (!dw || dw < 4 || dw > 26) return res.status(400).json({ success: false, message: "Duration must be between 4 and 26 weeks." });
    if (stipend === undefined || stipend === null || stipend === "") return res.status(400).json({ success: false, message: "Stipend is required." });
    if (!requirements || !requirements.trim()) return res.status(400).json({ success: false, message: "Required skills are required." });
    if (!domain || !domain.trim()) return res.status(400).json({ success: false, message: "Domain is required." });
    if (!description || !description.trim()) return res.status(400).json({ success: false, message: "Description is required." });
    if (!location || !location.trim()) return res.status(400).json({ success: false, message: "Location is required." });
    if (!start_date || !end_date || !application_deadline) return res.status(400).json({ success: false, message: "All dates are required." });

    await pool.query(
      `UPDATE internships SET title=?,description=?,domain=?,location=?,duration_weeks=?,stipend=?,
       vacancies=?,start_date=?,end_date=?,application_deadline=?,requirements=? WHERE id=?`,
      [title.trim(), description.trim(), domain.trim(), location.trim(), dw, parseFloat(stipend)||0,
       vacancies||1, start_date, end_date, application_deadline, requirements.trim(), req.params.id]);
    res.json({ success: true, message: "Internship updated" });
  } catch (err) { res.status(500).json({ success: false, message: "Failed to update internship" }); }
};

const approveInternship = async (req, res) => {
  try {
    const { action } = req.body; // "approve" or "reject"
    const status = action === "approve" ? "approved" : "archived";
    const internshipId = parseInt(req.params.id);

    await pool.query(
      "UPDATE internships SET status=?, approved_by=?, approved_at=NOW() WHERE id=?",
      [status, req.user.id, internshipId]);
    await pool.query(
      "INSERT INTO activity_logs (user_id,action,entity_type,entity_id,details) VALUES (?,?,?,?,?)",
      [req.user.id, "INTERNSHIP_" + action.toUpperCase(), "internship", internshipId, `Internship ${action}d`]);

    // If approved, send notifications to ALL students and faculty
    if (action === "approve") {
      try {
        // Fetch internship + company details for the notification message
        const [[intern]] = await pool.query(
          `SELECT i.title, i.domain, i.duration_weeks, i.stipend, c.name AS company_name
           FROM internships i JOIN companies c ON i.company_id = c.id WHERE i.id = ?`,
          [internshipId]);

        if (intern) {
          const notifTitle = "New Internship Available 🎓";
          const durationText = intern.duration_weeks >= 4
            ? `${intern.duration_weeks} weeks`
            : `${intern.duration_weeks}w`;
          const notifMessage =
            `${intern.company_name} has posted a new ${intern.title} internship.\n` +
            `Domain: ${intern.domain} | Duration: ${durationText} | Stipend: ₹${parseInt(intern.stipend).toLocaleString()}/month`;
          const notifLink = `/internships/${internshipId}`;

          // Get all student and faculty user IDs
          const [recipients] = await pool.query(
            "SELECT id FROM users WHERE role IN ('student','faculty') AND is_active=1"
          );

          if (recipients.length > 0) {
            // Build bulk insert values — skip duplicates using INSERT IGNORE
            // We need a unique constraint on (user_id, link) or (user_id, title+message)
            // Since notifications table has no unique on (user_id, link), we do a manual check per-internship
            // to avoid duplicates: delete existing notifications with same link for these users first (if any),
            // then bulk insert.
            // Better approach: check if notification with same link already exists for each user
            const values = recipients.map(r => [r.id, notifTitle, notifMessage, "info", notifLink]);

            // Remove any pre-existing notifications for this internship link to prevent duplicates
            await pool.query(
              "DELETE FROM notifications WHERE link = ? AND title = ?",
              [notifLink, notifTitle]
            );

            // Bulk insert notifications for all recipients
            await pool.query(
              "INSERT INTO notifications (user_id, title, message, type, link) VALUES ?",
              [values]
            );
          }
        }
      } catch (notifErr) {
        // Don't fail the main request if notification sending fails
        console.error("Notification error:", notifErr.message);
      }
    }

    res.json({ success: true, message: `Internship ${action}d successfully` });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: "Failed to update internship status" }); }
};

const archiveInternship = async (req, res) => {
  try {
    await pool.query("UPDATE internships SET status='archived' WHERE id=?", [req.params.id]);
    res.json({ success: true, message: "Internship archived" });
  } catch (err) { res.status(500).json({ success: false, message: "Failed to archive internship" }); }
};

module.exports = { getInternships, getInternship, createInternship, updateInternship, approveInternship, archiveInternship };
