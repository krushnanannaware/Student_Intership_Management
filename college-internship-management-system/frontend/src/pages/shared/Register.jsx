import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authAPI, adminAPI } from "../../services/api";
import toast from "react-hot-toast";
import {
  GraduationCap, UserCheck, User, Mail,
  Phone, Hash, BookOpen, Award, Briefcase, Lock, Eye, EyeOff,
  AtSign,
} from "lucide-react";

/* ── tiny helpers ───────────────────────────────────────────── */
const DESIGNATIONS = [
  "Assistant Professor", "Associate Professor", "Professor",
  "Lecturer", "Senior Lecturer", "Head of Department",
];

const initialStudent = {
  username: "", full_name: "", email: "", phone: "", enrollment_no: "",
  department_id: "", year_of_study: 1, gpa: "",
  password: "", confirm_password: "",
};

const initialFaculty = {
  username: "", full_name: "", email: "", phone: "", employee_id: "",
  department_id: "", designation: "Assistant Professor",
  password: "", confirm_password: "",
};

/* ── Label with required asterisk ── */
function RequiredLabel({ children }) {
  return (
    <span>
      {children} <span style={{ color: "var(--danger)" }}>*</span>
    </span>
  );
}

/* ── Field wrapper ── */
function Field({ label, required, icon: Icon, error, children }) {
  return (
    <div className="form-group">
      <label className="form-label">
        {required ? <RequiredLabel>{label}</RequiredLabel> : label}
      </label>
      <div style={{ position: "relative" }}>
        {Icon && (
          <Icon
            size={15}
            style={{
              position: "absolute", left: 12,
              top: "50%", transform: "translateY(-50%)",
              color: "var(--text-muted)", pointerEvents: "none", zIndex: 1,
            }}
          />
        )}
        {children}
      </div>
      {error && (
        <span style={{ fontSize: 12, color: "var(--danger)", marginTop: 4, display: "block" }}>
          {error}
        </span>
      )}
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────── */
export default function Register() {
  const [role,       setRole]       = useState(null);
  const [form,       setForm]       = useState({});
  const [departments, setDepts]     = useState([]);
  const [errors,     setErrors]     = useState({});
  const [loading,    setLoading]    = useState(false);
  const [showPw,     setShowPw]     = useState(false);
  const [showCPw,    setShowCPw]    = useState(false);
  const navigate                    = useNavigate();

  /* fetch departments once */
  useEffect(() => {
    adminAPI.getDepartments()
      .then(r => setDepts(r.data.data || []))
      .catch(() => {});
  }, []);

  /* reset form when role changes */
  const selectRole = (r) => {
    setRole(r);
    setForm(r === "student" ? { ...initialStudent } : { ...initialFaculty });
    setErrors({});
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  /* ── Validation ── */
  const validate = () => {
    const e = {};

    // Username
    if (!form.username?.trim()) {
      e.username = "Username is required.";
    } else if (form.username.trim().length < 3) {
      e.username = "Username must be at least 3 characters.";
    } else if (!/^[a-zA-Z0-9_.-]+$/.test(form.username.trim())) {
      e.username = "Username may only contain letters, numbers, _ . -";
    }

    // Full name
    if (!form.full_name?.trim()) e.full_name = "Full name is required.";

    // Email
    if (!form.email?.trim()) {
      e.email = "Email is required.";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      e.email = "Please enter a valid email address.";
    }

    // Phone
    if (!form.phone?.trim()) {
      e.phone = "Phone number is required.";
    } else if (!/^\+?[\d\s\-]{10,15}$/.test(form.phone)) {
      e.phone = "Phone: 10–15 digits (e.g. +91 9876543210).";
    }

    // Department
    if (!form.department_id) e.department_id = "Department is required.";

    // Password
    if (!form.password) {
      e.password = "Password is required.";
    } else if (form.password.length < 8) {
      e.password = "Password must be at least 8 characters.";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(form.password)) {
      e.password = "Need uppercase, lowercase, number & special char.";
    }

    if (!form.confirm_password) {
      e.confirm_password = "Please confirm your password.";
    } else if (form.password !== form.confirm_password) {
      e.confirm_password = "Passwords do not match.";
    }

    // Role-specific
    if (role === "student") {
      if (!form.enrollment_no?.trim()) e.enrollment_no = "Enrollment number is required.";
      if (form.gpa && (parseFloat(form.gpa) < 0 || parseFloat(form.gpa) > 4))
        e.gpa = "GPA must be between 0.0 – 4.0.";
    } else {
      if (!form.employee_id?.trim()) e.employee_id = "Employee ID is required.";
      if (!form.designation)         e.designation  = "Designation is required.";
    }

    setErrors(e);
    return e;
  };

  /* ── Submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();

    if (Object.keys(errs).length > 0) {
      // Show first error as toast
      const firstErr = Object.values(errs)[0];
      toast.error(firstErr);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        role,
        username: form.username.trim(),
        ...(role === "student" ? { gpa: parseFloat(form.gpa) || 0 } : {}),
      };
      delete payload.confirm_password;
      await authAPI.register(payload);
      toast.success(`${role === "student" ? "Student" : "Faculty"} registered successfully! Please login.`);
      navigate("/login");
    } catch (err) {
      const msg    = err.response?.data?.message || "";
      const status = err.response?.status;

      if (status === 409) {
        // Duplicate conflict
        if (msg.toLowerCase().includes("email")) {
          setErrors(prev => ({ ...prev, email: msg }));
          toast.error(msg);
        } else if (msg.toLowerCase().includes("username")) {
          setErrors(prev => ({ ...prev, username: msg }));
          toast.error(msg);
        } else if (msg.toLowerCase().includes("enrollment")) {
          setErrors(prev => ({ ...prev, enrollment_no: msg }));
          toast.error(msg);
        } else if (msg.toLowerCase().includes("employee")) {
          setErrors(prev => ({ ...prev, employee_id: msg }));
          toast.error(msg);
        } else {
          toast.error(msg || "Duplicate entry. Please check your information.");
        }
      } else if (status === 400) {
        toast.error(msg || "Please complete all required fields.");
      } else {
        toast.error(msg || "Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const iconStyle = { paddingLeft: 38 };

  /* ── Render ── */
  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 620 }}>

        {/* Logo */}
        <div className="auth-logo">
          <div style={{
            width: 56, height: 56,
            background: "linear-gradient(135deg,#4f46e5,#06b6d4)",
            borderRadius: 16, display: "flex", alignItems: "center",
            justifyContent: "center", margin: "0 auto 16px", fontSize: 28,
          }}>🎓</div>
          <h1 className="gradient-text">Create Account</h1>
          <p style={{ color: "var(--text-muted)" }}>Select your role to get started</p>
        </div>

        {/* ── Role Selector ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 28 }}>
          {[
            { key: "student", Icon: GraduationCap, label: "Student",  sub: "Explore & apply for internships", grad: "135deg,#4f46e5,#6366f1", border: "#4f46e5" },
            { key: "faculty", Icon: UserCheck,     label: "Faculty",  sub: "Post & manage internships",       grad: "135deg,#0891b2,#06b6d4", border: "#06b6d4" },
          ].map(({ key, Icon, label, sub, grad, border }) => {
            const active = role === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => selectRole(key)}
                style={{
                  padding: "18px 14px", borderRadius: 14,
                  border: `2px solid ${active ? border : "var(--border)"}`,
                  background: active ? `linear-gradient(${grad})22` : "var(--surface-2)",
                  cursor: "pointer", transition: "all 0.2s",
                  textAlign: "left", outline: "none",
                  boxShadow: active ? `0 0 0 3px ${border}33` : "none",
                  transform: active ? "scale(1.02)" : "scale(1)",
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 10, marginBottom: 10,
                  background: active ? `linear-gradient(${grad})` : "var(--surface-3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon size={20} color={active ? "#fff" : "var(--text-muted)"} />
                </div>
                <div style={{ fontWeight: 700, fontSize: 15, color: active ? "#fff" : "var(--text-primary)", marginBottom: 3 }}>
                  {label}
                </div>
                <div style={{ fontSize: 12, color: active ? "rgba(255,255,255,.75)" : "var(--text-muted)", lineHeight: 1.4 }}>
                  {sub}
                </div>
                {active && (
                  <div style={{ marginTop: 8, fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", color: border, textTransform: "uppercase" }}>
                    ✓ Selected
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Form ── */}
        {role && (
          <form onSubmit={handleSubmit} noValidate style={{ animation: "fadeIn .25s ease" }}>

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
              <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {role === "student" ? "Student Details" : "Faculty Details"}
              </span>
              <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            </div>

            {/* Row 1 — Username + Full Name */}
            <div className="form-row">
              <Field label="Username" required icon={AtSign} error={errors.username}>
                <input
                  id="reg-username"
                  className={`form-control ${errors.username ? "border-danger" : ""}`}
                  style={iconStyle}
                  type="text"
                  placeholder="john_doe"
                  value={form.username}
                  onChange={e => set("username", e.target.value)}
                />
              </Field>
              <Field label="Full Name" required icon={User} error={errors.full_name}>
                <input
                  id="reg-full-name"
                  className={`form-control ${errors.full_name ? "border-danger" : ""}`}
                  style={iconStyle}
                  type="text"
                  placeholder="John Doe"
                  value={form.full_name}
                  onChange={e => set("full_name", e.target.value)}
                />
              </Field>
            </div>

            {/* Row 2 — Email + Phone */}
            <div className="form-row">
              <Field label="Email Address" required icon={Mail} error={errors.email}>
                <input
                  id="reg-email"
                  className={`form-control ${errors.email ? "border-danger" : ""}`}
                  style={iconStyle}
                  type="email"
                  placeholder="john@college.edu"
                  value={form.email}
                  onChange={e => set("email", e.target.value)}
                />
              </Field>
              <Field label="Phone Number" required icon={Phone} error={errors.phone}>
                <input
                  id="reg-phone"
                  className={`form-control ${errors.phone ? "border-danger" : ""}`}
                  style={iconStyle}
                  type="text"
                  placeholder="+91 9876543210"
                  value={form.phone}
                  onChange={e => set("phone", e.target.value)}
                />
              </Field>
            </div>

            {/* Row 3 — Unique ID (enrollment / employee) */}
            <div className="form-row">
              {role === "student" ? (
                <Field label="Enrollment Number" required icon={Hash} error={errors.enrollment_no}>
                  <input
                    id="reg-enrollment"
                    className={`form-control ${errors.enrollment_no ? "border-danger" : ""}`}
                    style={iconStyle}
                    type="text"
                    placeholder="CSE2022001"
                    value={form.enrollment_no}
                    onChange={e => set("enrollment_no", e.target.value)}
                  />
                </Field>
              ) : (
                <Field label="Employee ID" required icon={Hash} error={errors.employee_id}>
                  <input
                    id="reg-employee-id"
                    className={`form-control ${errors.employee_id ? "border-danger" : ""}`}
                    style={iconStyle}
                    type="text"
                    placeholder="FAC2024001"
                    value={form.employee_id}
                    onChange={e => set("employee_id", e.target.value)}
                  />
                </Field>
              )}

              {/* Department */}
              <Field label="Department" required icon={BookOpen} error={errors.department_id}>
                <select
                  id="reg-department"
                  className={`form-control ${errors.department_id ? "border-danger" : ""}`}
                  style={iconStyle}
                  value={form.department_id}
                  onChange={e => set("department_id", e.target.value)}
                >
                  <option value="">Select Department</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </Field>
            </div>

            {/* Row 4 — Year / Designation */}
            <div className="form-row">
              {role === "student" ? (
                <Field label="Year of Study" required icon={Award} error={errors.year_of_study}>
                  <select
                    id="reg-year"
                    className="form-control"
                    style={iconStyle}
                    value={form.year_of_study}
                    onChange={e => set("year_of_study", parseInt(e.target.value))}
                  >
                    {[1, 2, 3, 4, 5, 6].map(y => (
                      <option key={y} value={y}>Year {y}</option>
                    ))}
                  </select>
                </Field>
              ) : (
                <Field label="Designation" required icon={Briefcase} error={errors.designation}>
                  <select
                    id="reg-designation"
                    className={`form-control ${errors.designation ? "border-danger" : ""}`}
                    style={iconStyle}
                    value={form.designation}
                    onChange={e => set("designation", e.target.value)}
                  >
                    {DESIGNATIONS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </Field>
              )}

              {/* GPA — students only */}
              {role === "student" && (
                <Field label="GPA (0.0 – 4.0)" icon={Award} error={errors.gpa}>
                  <input
                    id="reg-gpa"
                    className={`form-control ${errors.gpa ? "border-danger" : ""}`}
                    style={iconStyle}
                    type="number"
                    step="0.01"
                    min="0"
                    max="4"
                    placeholder="3.75"
                    value={form.gpa}
                    onChange={e => set("gpa", e.target.value)}
                  />
                </Field>
              )}
            </div>

            {/* Row 5 — Password + Confirm */}
            <div className="form-row">
              <Field label="Password" required icon={Lock} error={errors.password}>
                <input
                  id="reg-password"
                  className={`form-control ${errors.password ? "border-danger" : ""}`}
                  style={{ ...iconStyle, paddingRight: 40 }}
                  type={showPw ? "text" : "password"}
                  placeholder="Min 8 chars"
                  value={form.password}
                  onChange={e => set("password", e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </Field>

              <Field label="Confirm Password" required icon={Lock} error={errors.confirm_password}>
                <input
                  id="reg-confirm-password"
                  className={`form-control ${errors.confirm_password ? "border-danger" : ""}`}
                  style={{ ...iconStyle, paddingRight: 40 }}
                  type={showCPw ? "text" : "password"}
                  placeholder="Repeat password"
                  value={form.confirm_password}
                  onChange={e => set("confirm_password", e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowCPw(v => !v)}
                  style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
                >
                  {showCPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </Field>
            </div>

            {/* Password hint */}
            <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 20, lineHeight: 1.5 }}>
              💡 Password must have uppercase, lowercase, number &amp; special character (e.g. <code>Test@1234</code>)
            </p>

            {/* Submit */}
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center", padding: "13px" }}
              disabled={loading}
            >
              {loading ? (
                <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />Creating Account...</>
              ) : (
                `Register as ${role === "student" ? "Student" : "Faculty"}`
              )}
            </button>
          </form>
        )}

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "var(--text-muted)" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "var(--primary-light)" }}>Sign in</Link>
        </p>
      </div>

      {/* Fade-in keyframe */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .border-danger { border-color: var(--danger) !important; }
        .border-danger:focus { box-shadow: 0 0 0 3px rgba(239,68,68,0.15) !important; }
      `}</style>
    </div>
  );
}
