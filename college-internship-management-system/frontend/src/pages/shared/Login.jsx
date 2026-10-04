import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";

export default function Login() {
  const [form,    setForm]    = useState({ email: "", password: "" });
  const [showPw,  setShowPw]  = useState(false);
  const [loading, setLoading] = useState(false);
  const { login }             = useAuth();
  const navigate              = useNavigate();

  const demoCredentials = [
    { label: "Admin",   email: "admin@college.edu",        password: "password", color: "#ef4444" },
    { label: "Faculty", email: "faculty.raj@college.edu",  password: "password", color: "#818cf8" },
    { label: "Student", email: "arjun.sharma@student.edu", password: "password", color: "#06b6d4" },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ── Frontend validation with toasts ──
    if (!form.email.trim()) {
      toast.error("Please enter your email address.");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(form.email)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (!form.password) {
      toast.error("Please enter your password.");
      return;
    }

    setLoading(true);
    try {
      const user = await login(form.email.trim(), form.password);
      toast.success(`Welcome back, ${user.profile?.full_name || user.email}!`);
      if (user.role === "admin")        navigate("/admin/dashboard");
      else if (user.role === "faculty") navigate("/faculty/dashboard");
      else                              navigate("/student/dashboard");
    } catch (err) {
      const msg = err.response?.data?.message;
      if (err.response?.status === 401) {
        toast.error("Invalid email or password.", { id: "login-error" });
      } else if (err.response?.status === 400) {
        toast.error(msg || "Please check your input.", { id: "login-error" });
      } else {
        toast.error("Login failed. Please try again.", { id: "login-error" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div style={{
            width: 56, height: 56,
            background: "linear-gradient(135deg,#4f46e5,#06b6d4)",
            borderRadius: 16, display: "flex", alignItems: "center",
            justifyContent: "center", margin: "0 auto 16px", fontSize: 28,
          }}>🎓</div>
          <h1 className="gradient-text">College IMS</h1>
          <p>Internship Management System</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label">
              Email Address <span style={{ color: "var(--danger)" }}>*</span>
            </label>
            <div style={{ position: "relative" }}>
              <Mail size={16} style={{
                position: "absolute", left: 12, top: "50%",
                transform: "translateY(-50%)", color: "var(--text-muted)",
              }} />
              <input
                id="login-email"
                className="form-control"
                type="email"
                placeholder="your@email.edu"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                style={{ paddingLeft: 40 }}
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <label className="form-label" style={{ margin: 0 }}>
                Password <span style={{ color: "var(--danger)" }}>*</span>
              </label>
              <Link
                to="/forgot-password"
                style={{ fontSize: 12, color: "var(--primary-light)", textDecoration: "none" }}
              >
                Forgot Password?
              </Link>
            </div>
            <div style={{ position: "relative" }}>
              <Lock size={16} style={{
                position: "absolute", left: 12, top: "50%",
                transform: "translateY(-50%)", color: "var(--text-muted)",
              }} />
              <input
                id="login-password"
                className="form-control"
                type={showPw ? "text" : "password"}
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                style={{ paddingLeft: 40, paddingRight: 40 }}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                style={{
                  position: "absolute", right: 12, top: "50%",
                  transform: "translateY(-50%)",
                  background: "none", border: "none",
                  color: "var(--text-muted)", cursor: "pointer",
                }}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", justifyContent: "center", padding: "12px" }}
            disabled={loading}
          >
            {loading
              ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />Signing in...</>
              : "Sign In"}
          </button>
        </form>

        <div style={{ marginTop: 24 }}>
          <p style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", marginBottom: 12 }}>
            Quick Demo Login
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {demoCredentials.map(cred => (
              <button
                key={cred.label}
                className="btn btn-sm"
                style={{
                  flex: 1,
                  background: `${cred.color}22`,
                  color: cred.color,
                  border: `1px solid ${cred.color}44`,
                  justifyContent: "center",
                }}
                onClick={() => setForm({ email: cred.email, password: cred.password })}
              >
                {cred.label}
              </button>
            ))}
          </div>
        </div>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "var(--text-muted)" }}>
          New student?{" "}
          <Link to="/register" style={{ color: "var(--primary-light)" }}>Register here</Link>
        </p>
      </div>
    </div>
  );
}
