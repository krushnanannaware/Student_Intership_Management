const pool = require("../config/db");

const getEvaluations = async (req, res) => {
  try {
    let sql = `SELECT e.*, s.full_name AS student_name, s.enrollment_no,
               i.title AS internship_title, c.name AS company_name
               FROM evaluations e
               JOIN applications a ON e.application_id=a.id
               JOIN students s ON a.student_id=s.id
               JOIN internships i ON a.internship_id=i.id
               JOIN companies c ON i.company_id=c.id
               WHERE e.is_archived=0`;
    const params = [];
    if (req.user.role === "student") {
      const [st] = await pool.query("SELECT id FROM students WHERE user_id=?", [req.user.id]);
      sql += " AND a.student_id=?"; params.push(st[0]?.id);
    } else if (req.user.role === "faculty") {
      sql += " AND e.evaluated_by=?"; params.push(req.user.id);
    }
    sql += " ORDER BY e.created_at DESC";
    const [rows] = await pool.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: "Failed to fetch evaluations" }); }
};

const createEvaluation = async (req, res) => {
  try {
    const { application_id, evaluator_type, technical_skills, soft_skills, punctuality,
            responsibility, teamwork, learning_ability, comments, strengths, improvement_areas, recommend_fulltime } = req.body;
    const [result] = await pool.query(
      `INSERT INTO evaluations (application_id,evaluated_by,evaluator_type,technical_skills,soft_skills,
       punctuality,responsibility,teamwork,learning_ability,comments,strengths,improvement_areas,recommend_fulltime)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [application_id, req.user.id, evaluator_type, technical_skills, soft_skills,
       punctuality, responsibility, teamwork, learning_ability, comments, strengths, improvement_areas,
       recommend_fulltime !== undefined ? recommend_fulltime : null]);
    res.status(201).json({ success: true, message: "Evaluation created", data: { id: result.insertId } });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: "Failed to create evaluation", error: err.message }); }
};

const updateEvaluation = async (req, res) => {
  try {
    const { technical_skills, soft_skills, punctuality, responsibility, teamwork,
            learning_ability, comments, strengths, improvement_areas, recommend_fulltime } = req.body;
    await pool.query(
      `UPDATE evaluations SET technical_skills=?,soft_skills=?,punctuality=?,responsibility=?,
       teamwork=?,learning_ability=?,comments=?,strengths=?,improvement_areas=?,recommend_fulltime=?
       WHERE id=? AND evaluated_by=?`,
      [technical_skills, soft_skills, punctuality, responsibility, teamwork, learning_ability,
       comments, strengths, improvement_areas, recommend_fulltime, req.params.id, req.user.id]);
    res.json({ success: true, message: "Evaluation updated" });
  } catch (err) { res.status(500).json({ success: false, message: "Failed to update evaluation" }); }
};

module.exports = { getEvaluations, createEvaluation, updateEvaluation };
