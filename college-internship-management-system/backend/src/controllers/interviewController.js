const pool = require("../config/db");

const getInterviews = async (req, res) => {
  try {
    let sql = `SELECT iv.*, a.status AS app_status, s.full_name AS student_name, s.enrollment_no,
               i.title AS internship_title, c.name AS company_name, u.email AS scheduled_by_email
               FROM interviews iv
               JOIN applications a ON iv.application_id=a.id
               JOIN students s ON a.student_id=s.id
               JOIN internships i ON a.internship_id=i.id
               JOIN companies c ON i.company_id=c.id
               JOIN users u ON iv.scheduled_by=u.id WHERE 1=1`;
    const params = [];
    if (req.user.role === "student") {
      const [st] = await pool.query("SELECT id FROM students WHERE user_id=?", [req.user.id]);
      sql += " AND a.student_id=?"; params.push(st[0]?.id);
    } else if (req.user.role === "faculty") {
      sql += " AND iv.scheduled_by=?"; params.push(req.user.id);
    }
    sql += " ORDER BY iv.interview_date, iv.interview_time";
    const [rows] = await pool.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: "Failed to fetch interviews" }); }
};

const scheduleInterview = async (req, res) => {
  try {
    const { application_id, interview_date, interview_time, interviewer, meeting_link, location, notes } = req.body;

    // Validate date >= tomorrow
    const scheduled = new Date(`${interview_date}T${interview_time}`);
    const minDate = new Date();
    minDate.setHours(minDate.getHours() + 24);
    if (scheduled < minDate) {
      return res.status(400).json({ success: false, message: "Interview must be scheduled at least 24 hours in advance" });
    }

    const [result] = await pool.query(
      `INSERT INTO interviews (application_id,scheduled_by,interview_date,interview_time,interviewer,meeting_link,location,notes)
       VALUES (?,?,?,?,?,?,?,?)`,
      [application_id, req.user.id, interview_date, interview_time, interviewer, meeting_link, location, notes]);

    // Notify student
    const [app] = await pool.query(
      `SELECT s.user_id, i.title, c.name AS company FROM applications a
       JOIN students s ON a.student_id=s.id JOIN internships i ON a.internship_id=i.id
       JOIN companies c ON i.company_id=c.id WHERE a.id=?`, [application_id]);
    if (app.length) {
      await pool.query(
        "INSERT INTO notifications (user_id,title,message,type) VALUES (?,?,?,?)",
        [app[0].user_id, "Interview Scheduled",
         `Your interview for "${app[0].title}" at ${app[0].company} is scheduled on ${interview_date} at ${interview_time}.`,
         "info"]);
    }
    await pool.query("INSERT INTO activity_logs (user_id,action,entity_type,entity_id) VALUES (?,?,?,?)",
      [req.user.id,"INTERVIEW_SCHEDULED","interview",result.insertId]);
    res.status(201).json({ success: true, message: "Interview scheduled", data: { id: result.insertId } });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: "Failed to schedule interview" }); }
};

const updateInterview = async (req, res) => {
  try {
    const { interview_date, interview_time, interviewer, meeting_link, location, notes, result, result_comments } = req.body;
    if (interview_date && interview_time) {
      const scheduled = new Date(`${interview_date}T${interview_time}`);
      const minDate = new Date(); minDate.setHours(minDate.getHours() + 24);
      if (scheduled < minDate) {
        return res.status(400).json({ success: false, message: "Interview must be at least 24 hours from now" });
      }
    }
    await pool.query(
      `UPDATE interviews SET interview_date=COALESCE(?,interview_date), interview_time=COALESCE(?,interview_time),
       interviewer=COALESCE(?,interviewer), meeting_link=COALESCE(?,meeting_link),
       location=COALESCE(?,location), notes=COALESCE(?,notes),
       result=COALESCE(?,result), result_comments=COALESCE(?,result_comments) WHERE id=?`,
      [interview_date, interview_time, interviewer, meeting_link, location, notes, result, result_comments, req.params.id]);
    res.json({ success: true, message: "Interview updated" });
  } catch (err) { res.status(500).json({ success: false, message: "Failed to update interview" }); }
};

const cancelInterview = async (req, res) => {
  try {
    await pool.query("UPDATE interviews SET is_cancelled=1, result='cancelled' WHERE id=?", [req.params.id]);
    res.json({ success: true, message: "Interview cancelled" });
  } catch (err) { res.status(500).json({ success: false, message: "Failed to cancel interview" }); }
};

module.exports = { getInterviews, scheduleInterview, updateInterview, cancelInterview };
