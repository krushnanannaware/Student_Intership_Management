const bcrypt = require("bcryptjs");
const jwt    = require("jsonwebtoken");
const pool   = require("../config/db");

const generateToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );

/* ── Register ─────────────────────────────────────────────── */
const register = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const {
      email, password, role,
      full_name, phone, department_id,
      gpa, enrollment_no, year_of_study,
      designation, employee_id,
      username,
    } = req.body;

    // ── Mandatory field validation ──
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: "Email is required." });
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({ success: false, message: "Please enter a valid email address." });
    }
    if (!username || !username.trim()) {
      return res.status(400).json({ success: false, message: "Username is required." });
    }
    if (username.trim().length < 3) {
      return res.status(400).json({ success: false, message: "Username must be at least 3 characters." });
    }
    if (!/^[a-zA-Z0-9_.-]+$/.test(username.trim())) {
      return res.status(400).json({
        success: false,
        message: "Username may only contain letters, numbers, underscores, dots, or hyphens.",
      });
    }
    if (!password || password.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters." });
    }
    if (!full_name || !full_name.trim()) {
      return res.status(400).json({ success: false, message: "Full name is required." });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ success: false, message: "Phone number is required." });
    }
    if (!department_id) {
      return res.status(400).json({ success: false, message: "Department is required." });
    }

    const userRole = role || "student";
    if (userRole === "student") {
      if (!enrollment_no || !enrollment_no.trim()) {
        return res.status(400).json({ success: false, message: "Enrollment number is required." });
      }
    } else if (userRole === "faculty") {
      if (!employee_id || !employee_id.trim()) {
        return res.status(400).json({ success: false, message: "Employee ID is required." });
      }
    }

    // ── Duplicate checks ──
    const [existingEmail] = await conn.query(
      "SELECT id FROM users WHERE email = ?", [email]
    );
    if (existingEmail.length) {
      return res.status(409).json({ success: false, message: "This email is already registered." });
    }

    const [existingUsername] = await conn.query(
      "SELECT id FROM users WHERE username = ?", [username.trim()]
    );
    if (existingUsername.length) {
      return res.status(409).json({ success: false, message: "This username is already taken." });
    }

    const hashed = await bcrypt.hash(password, 10);
    await conn.beginTransaction();

    const [userResult] = await conn.query(
      "INSERT INTO users (email, username, password, role) VALUES (?, ?, ?, ?)",
      [email, username.trim(), hashed, userRole]
    );
    const userId = userResult.insertId;

    if (userRole === "student") {
      await conn.query(
        `INSERT INTO students (user_id, full_name, phone, department_id, gpa, enrollment_no, year_of_study)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, full_name, phone, department_id, gpa || 0.00, enrollment_no, year_of_study || 1]
      );
    } else if (userRole === "faculty") {
      await conn.query(
        `INSERT INTO faculty (user_id, full_name, phone, department_id, designation, employee_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, full_name, phone, department_id, designation || "Assistant Professor", employee_id]
      );
    }

    await conn.query(
      "INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)",
      [userId, "USER_REGISTERED", "user", userId, `New ${userRole} registered: ${email}`]
    );

    await conn.commit();
    const token = generateToken({ id: userId, email, role: userRole });
    return res.status(201).json({
      success: true,
      message: `${userRole === "student" ? "Student" : "Faculty"} registered successfully!`,
      token,
    });
  } catch (err) {
    await conn.rollback();
    console.error("Register error:", err);
    // Handle MySQL duplicate entry errors gracefully
    if (err.code === "ER_DUP_ENTRY") {
      if (err.message.includes("email")) {
        return res.status(409).json({ success: false, message: "This email is already registered." });
      }
      if (err.message.includes("username")) {
        return res.status(409).json({ success: false, message: "This username is already taken." });
      }
      if (err.message.includes("enrollment_no")) {
        return res.status(409).json({ success: false, message: "This enrollment number is already registered." });
      }
      if (err.message.includes("employee_id")) {
        return res.status(409).json({ success: false, message: "This employee ID is already registered." });
      }
    }
    res.status(500).json({ success: false, message: "Registration failed. Please try again." });
  } finally {
    conn.release();
  }
};

/* ── Login ────────────────────────────────────────────────── */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: "Please enter your email address." });
    }
    if (!password) {
      return res.status(400).json({ success: false, message: "Please enter your password." });
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({ success: false, message: "Please enter a valid email format." });
    }

    const [users] = await pool.query(
      "SELECT * FROM users WHERE email = ? AND is_active = 1",
      [email]
    );
    if (!users.length) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    const user  = users[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    await pool.query("UPDATE users SET last_login = NOW() WHERE id = ?", [user.id]);
    await pool.query(
      "INSERT INTO activity_logs (user_id, action, entity_type) VALUES (?, ?, ?)",
      [user.id, "USER_LOGIN", "user"]
    );

    let profile = null;
    if (user.role === "student") {
      const [s] = await pool.query(
        "SELECT s.*, d.name AS department_name FROM students s JOIN departments d ON s.department_id=d.id WHERE s.user_id=?",
        [user.id]
      );
      profile = s[0] || null;
    } else if (user.role === "faculty") {
      const [f] = await pool.query(
        "SELECT f.*, d.name AS department_name FROM faculty f JOIN departments d ON f.department_id=d.id WHERE f.user_id=?",
        [user.id]
      );
      profile = f[0] || null;
    }

    const token = generateToken(user);
    return res.json({
      success: true,
      token,
      user: { id: user.id, email: user.email, role: user.role, profile },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Login failed. Please try again." });
  }
};

/* ── Get Me ────────────────────────────────────────────────── */
const getMe = async (req, res) => {
  try {
    let profile = null;
    if (req.user.role === "student") {
      const [s] = await pool.query(
        "SELECT s.*, d.name AS department_name FROM students s JOIN departments d ON s.department_id=d.id WHERE s.user_id=?",
        [req.user.id]
      );
      profile = s[0] || null;
    } else if (req.user.role === "faculty") {
      const [f] = await pool.query(
        "SELECT f.*, d.name AS department_name FROM faculty f JOIN departments d ON f.department_id=d.id WHERE f.user_id=?",
        [req.user.id]
      );
      profile = f[0] || null;
    }
    res.json({ success: true, user: { ...req.user, profile } });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch profile." });
  }
};

/* ── Change Password ────────────────────────────────────────── */
const changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
      return res.status(400).json({ success: false, message: "Both current and new password are required." });
    }
    const [users] = await pool.query("SELECT password FROM users WHERE id = ?", [req.user.id]);
    const valid   = await bcrypt.compare(current_password, users[0].password);
    if (!valid) {
      return res.status(400).json({ success: false, message: "Current password is incorrect." });
    }
    if (new_password.length < 8) {
      return res.status(400).json({ success: false, message: "New password must be at least 8 characters." });
    }
    const hashed = await bcrypt.hash(new_password, 10);
    await pool.query("UPDATE users SET password = ? WHERE id = ?", [hashed, req.user.id]);
    res.json({ success: true, message: "Password changed successfully." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to change password." });
  }
};

module.exports = { register, login, getMe, changePassword };
