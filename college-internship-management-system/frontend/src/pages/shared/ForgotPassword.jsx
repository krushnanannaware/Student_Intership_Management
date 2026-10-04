import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Mail, KeyRound, Lock, Eye, EyeOff, ArrowLeft, RefreshCw } from "lucide-react";
import { forgotPasswordAPI } from "../../services/api";

/* ── Steps of the flow ── */
const STEP = { EMAIL: "email", OTP: "otp", RESET: "reset", DONE: "done" };

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [step,        setStep]        = useState(STEP.EMAIL);
  const [email,       setEmail]       = useState("");
  const [otp,         setOtp]         = useState("");
  const [resetToken,  setResetToken]  = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPw,   setConfirmPw]   = useState("");
  const [showPw,      setShowPw]      = useState(false);
  const [showCPw,     setShowCPw]     = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [cooldown,    setCooldown]    = useState(0);   // resend cooldown in seconds

  /* ── countdown timer for resend ── */
  const startCooldown = (seconds) => {
    setCooldown(seconds);
    const interval = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  /* ── Step 1: Request OTP ── */
  const handleRequestOTP = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email address.");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      toast.error("Please enter a valid email format.");
      return;
    }
    setLoading(true);
    try {
      const res = await forgotPasswordAPI.requestOTP({ email: email.trim() });
      toast.success(res.data.message || "OTP sent! Check your inbox.");
      setStep(STEP.OTP);
      startCooldown(60);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to send OTP. Please try again.";
      const cd  = err.response?.data?.cooldown;
      if (cd) startCooldown(cd);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  /* ── Step 1b: Resend OTP ── */
  const handleResend = async () => {
    if (cooldown > 0) {
      toast.error(`Please wait ${cooldown}s before resending.`);
      return;
    }
    setLoading(true);
    try {
      const res = await forgotPasswordAPI.requestOTP({ email: email.trim() });
      toast.success(res.data.message || "A new OTP has been sent!");
      startCooldown(60);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to resend OTP.";
      const cd  = err.response?.data?.cooldown;
      if (cd) startCooldown(cd);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  /* ── Step 2: Verify OTP ── */
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp.trim()) {
      toast.error("Please enter the OTP.");
      return;
    }
    if (!/^\d{6}$/.test(otp.trim())) {
      toast.error("OTP must be a 6-digit number.");
      return;
    }
    setLoading(true);
    try {
      const res = await forgotPasswordAPI.verifyOTP({ email: email.trim(), otp: otp.trim() });
      setResetToken(res.data.resetToken);
      toast.success("OTP verified! Set your new password.");
      setStep(STEP.RESET);
    } catch (err) {
      toast.error(err.response?.data?.message || "OTP verification failed.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Step 3: Reset Password ── */
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword) {
      toast.error("Please enter your new password.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(newPassword)) {
      toast.error("Password must include uppercase, lowercase, number & special character.");
      return;
    }
    if (newPassword !== confirmPw) {
      toast.error("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await forgotPasswordAPI.resetPassword({
        email: email.trim(),
        resetToken,
        new_password:     newPassword,
        confirm_password: confirmPw,
      });
      toast.success(res.data.message || "Password reset successfully!");
      setStep(STEP.DONE);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  /* ── shared styles ── */
  const inputWrap = { position: "relative" };
  const iconSt    = {
    position: "absolute", left: 12, top: "50%",
    transform: "translateY(-50%)",
    color: "var(--text-muted)", pointerEvents: "none",
  };

  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* Logo */}
        <div className="auth-logo">
          <div style={{
            width: 56, height: 56,
            background: "linear-gradient(135deg,#4f46e5,#06b6d4)",
            borderRadius: 16, display: "flex", alignItems: "center",
            justifyContent: "center", margin: "0 auto 16px", fontSize: 28,
          }}>🎓</div>
          <h1 className="gradient-text">Forgot Password</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
            {step === STEP.EMAIL && "Enter your registered email to receive an OTP."}
            {step === STEP.OTP   && `Enter the 6-digit OTP sent to ${email}.`}
            {step === STEP.RESET && "Create your new password."}
            {step === STEP.DONE  && "Your password has been reset successfully."}
          </p>
        </div>

        {/* ── Step indicator ── */}
        {step !== STEP.DONE && (
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 24 }}>
            {[STEP.EMAIL, STEP.OTP, STEP.RESET].map((s, i) => {
              const active = s === step;
              const done   = [STEP.EMAIL, STEP.OTP, STEP.RESET].indexOf(step) > i;
              return (
                <div key={s} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: done ? "var(--success)" : active ? "var(--primary)" : "var(--dark-border)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 700, color: "#fff",
                    transition: "background 0.3s",
                  }}>
                    {done ? "✓" : i + 1}
                  </div>
                  {i < 2 && (
                    <div style={{
                      width: 40, height: 2,
                      background: done ? "var(--success)" : "var(--dark-border)",
                      transition: "background 0.3s",
                    }} />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── STEP 1: Email ── */}
        {step === STEP.EMAIL && (
          <form onSubmit={handleRequestOTP}>
            <div className="form-group">
              <label className="form-label">Email Address <span style={{ color: "var(--danger)" }}>*</span></label>
              <div style={inputWrap}>
                <Mail size={16} style={iconSt} />
                <input
                  id="fp-email"
                  className="form-control"
                  type="email"
                  placeholder="your@email.edu"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{ paddingLeft: 40 }}
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center", padding: "12px" }}
              disabled={loading}
            >
              {loading
                ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Sending OTP...</>
                : "Send OTP"}
            </button>
          </form>
        )}

        {/* ── STEP 2: OTP ── */}
        {step === STEP.OTP && (
          <form onSubmit={handleVerifyOTP}>
            <div className="form-group">
              <label className="form-label">6-Digit OTP <span style={{ color: "var(--danger)" }}>*</span></label>
              <div style={inputWrap}>
                <KeyRound size={16} style={iconSt} />
                <input
                  id="fp-otp"
                  className="form-control"
                  type="text"
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  placeholder="••••••"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
                  style={{ paddingLeft: 40, letterSpacing: 6, fontSize: 20, textAlign: "center" }}
                  autoFocus
                />
              </div>
              <span style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4, display: "block" }}>
                Didn't receive it?{" "}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={cooldown > 0 || loading}
                  style={{
                    background: "none", border: "none", cursor: cooldown > 0 ? "not-allowed" : "pointer",
                    color: cooldown > 0 ? "var(--text-muted)" : "var(--primary-light)",
                    fontSize: 12, fontWeight: 600, padding: 0,
                  }}
                >
                  {cooldown > 0
                    ? <><RefreshCw size={11} style={{ verticalAlign: "middle", marginRight: 3 }} />Resend in {cooldown}s</>
                    : "Resend OTP"}
                </button>
              </span>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center", padding: "12px" }}
              disabled={loading}
            >
              {loading
                ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Verifying...</>
                : "Verify OTP"}
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              style={{ width: "100%", justifyContent: "center", padding: "10px", marginTop: 10 }}
              onClick={() => { setStep(STEP.EMAIL); setOtp(""); }}
            >
              <ArrowLeft size={14} /> Change Email
            </button>
          </form>
        )}

        {/* ── STEP 3: New Password ── */}
        {step === STEP.RESET && (
          <form onSubmit={handleResetPassword}>
            <div className="form-group">
              <label className="form-label">New Password <span style={{ color: "var(--danger)" }}>*</span></label>
              <div style={inputWrap}>
                <Lock size={16} style={iconSt} />
                <input
                  id="fp-new-password"
                  className="form-control"
                  type={showPw ? "text" : "password"}
                  placeholder="Min 8 chars"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  style={{ paddingLeft: 40, paddingRight: 40 }}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password <span style={{ color: "var(--danger)" }}>*</span></label>
              <div style={inputWrap}>
                <Lock size={16} style={iconSt} />
                <input
                  id="fp-confirm-password"
                  className="form-control"
                  type={showCPw ? "text" : "password"}
                  placeholder="Repeat password"
                  value={confirmPw}
                  onChange={e => setConfirmPw(e.target.value)}
                  style={{ paddingLeft: 40, paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShowCPw(v => !v)}
                  style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
                >
                  {showCPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 16, lineHeight: 1.5 }}>
              💡 Password must have uppercase, lowercase, number &amp; special character (e.g. <code>Test@1234</code>)
            </p>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center", padding: "12px" }}
              disabled={loading}
            >
              {loading
                ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Resetting...</>
                : "Reset Password"}
            </button>
          </form>
        )}

        {/* ── STEP 4: Done ── */}
        {step === STEP.DONE && (
          <div style={{ textAlign: "center" }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "rgba(16,185,129,0.15)", border: "2px solid var(--success)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px", fontSize: 30,
            }}>✓</div>
            <h3 style={{ color: "var(--success)", marginBottom: 8 }}>Password Reset!</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 24 }}>
              Your password has been changed successfully. Please log in with your new password.
            </p>
            <button
              className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center", padding: "12px" }}
              onClick={() => navigate("/login")}
            >
              Go to Login
            </button>
          </div>
        )}

        {step !== STEP.DONE && (
          <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "var(--text-muted)" }}>
            <Link to="/login" style={{ color: "var(--primary-light)", display: "inline-flex", alignItems: "center", gap: 4 }}>
              <ArrowLeft size={13} /> Back to Login
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
