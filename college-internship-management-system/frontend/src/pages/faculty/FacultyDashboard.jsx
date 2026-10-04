import { useState, useEffect, useMemo } from "react";
import { adminAPI } from "../../services/api";
import toast from "react-hot-toast";
import {
  Briefcase, ClipboardList, Calendar, Award, Users,
  Search, ChevronDown, ChevronRight, Lightbulb, Send, X
} from "lucide-react";

const STATUS_COLORS = {
  pending:    "badge-pending-status",
  shortlisted:"badge-shortlisted",
  accepted:   "badge-approved",
  rejected:   "badge-rejected",
  withdrawn:  "badge-secondary",
};

const STATUS_LABELS = {
  pending:    "Pending / Applied",
  shortlisted:"Shortlisted",
  accepted:   "Accepted",
  rejected:   "Rejected",
  withdrawn:  "Withdrawn",
};

export default function FacultyDashboard() {
  const [data, setData]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatus]   = useState("all");
  const [expanded, setExpanded]     = useState({}); // { studentId: bool }
  const [suggModal, setSuggModal]   = useState(null); // { student_user_id, full_name, internship_title, company_name, required_skills }
  const [suggText, setSuggText]     = useState("");
  const [sending, setSending]       = useState(false);
  const [activeTab, setActiveTab]   = useState("students"); // "students" | "overview" | "suggestions"
  const [mySuggestions, setSugg]    = useState([]);
  const [suggLoading, setSuggLoad]  = useState(false);

  useEffect(() => {
    adminAPI.getFacultyDashboard()
      .then(r => setData(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const loadSuggestions = () => {
    setSuggLoad(true);
    adminAPI.getSkillSuggestions()
      .then(r => setSugg(r.data.data || []))
      .catch(() => toast.error("Failed to load suggestions"))
      .finally(() => setSuggLoad(false));
  };

  useEffect(() => {
    if (activeTab === "suggestions") loadSuggestions();
  }, [activeTab]);

  // Group allStudentApplications rows by student_id
  const studentMap = useMemo(() => {
    if (!data?.allStudentApplications) return {};
    const map = {};
    for (const row of data.allStudentApplications) {
      if (!map[row.student_id]) {
        map[row.student_id] = {
          student_id:     row.student_id,
          full_name:      row.full_name,
          enrollment_no:  row.enrollment_no,
          email:          row.student_email,
          department:     row.department_name,
          gpa:            row.gpa,
          applications:   [],
        };
      }
      if (row.application_id) {
        map[row.student_id].applications.push({
          application_id:   row.application_id,
          status:           row.app_status,
          applied_at:       row.applied_at,
          review_notes:     row.review_notes,
          internship_id:    row.internship_id,
          internship_title: row.internship_title,
          domain:           row.domain,
          duration_weeks:   row.duration_weeks,
          stipend:          row.stipend,
          required_skills:  row.required_skills,
          company_name:     row.company_name,
        });
      }
    }
    return map;
  }, [data]);

  const students = useMemo(() => Object.values(studentMap), [studentMap]);

  const filtered = useMemo(() => {
    let list = students;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        s.full_name.toLowerCase().includes(q) ||
        s.enrollment_no?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.department?.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") {
      list = list.filter(s => s.applications.some(a => a.status === statusFilter));
    }
    return list;
  }, [students, search, statusFilter]);

  const toggleExpand = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const openSuggModal = (student, app = null) => {
    setSuggModal({
      student_user_id:  null, // will be fetched separately; we pass student info
      student_id_row:   student.student_id,
      full_name:        student.full_name,
      email:            student.email,
      internship_title: app?.internship_title || "",
      company_name:     app?.company_name || "",
      required_skills:  app?.required_skills || "",
      domain:           app?.domain || "",
    });
    setSuggText("");
  };

  const sendSuggestion = async () => {
    if (!suggText.trim()) { toast.error("Please enter a suggestion."); return; }
    if (suggText.trim().length < 5) { toast.error("Suggestion must be at least 5 characters."); return; }
    setSending(true);
    try {
      // Fetch the student's user_id from the dashboard data
      const row = data.allStudentApplications.find(r => r.student_id === suggModal.student_id_row);
      if (!row) { toast.error("Could not identify student."); setSending(false); return; }

      // We need the user_id — it's not directly in our data. We stored student_email.
      // Use the getUsers endpoint or pass student_user_id differently.
      // Since we have email, we'll POST with student_email and let the backend resolve.
      // But our backend expects student_user_id. Let's find it from the students endpoint.
      // Actually, we can get user_id by querying /students — but simpler: add user_id to the dashboard query.
      // For now, we pass student_email and resolve on backend — but our backend uses user_id.
      // We need user_id. Let's check if it's available in the activity_logs table context.
      // BEST FIX: add user_id to allStudentApplications in backend. Let's use what we have:
      // The studentMap stores email. We'll pass it as a workaround by looking it up.
      // Since this is the faculty dashboard, let's fetch user_id from /admin/users API.

      // Actually the simplest: read from our studentMap — we have student_email.
      // The backend getUsers returns user id. Let's use it.
      // But to avoid another API call, let's add user_id to the dashboard query (we'll do that below too).
      // For now, use the email-based lookup via a separate call:
      const usersRes = await adminAPI.getUsers(); // returns all users with id + email
      const userRecord = (usersRes.data.data || []).find(u => u.email === suggModal.email);
      if (!userRecord) { toast.error("Could not find student user account."); setSending(false); return; }

      await adminAPI.sendSkillSuggestion({
        student_user_id:  userRecord.id,
        suggestion:       suggText.trim(),
        internship_title: suggModal.internship_title || undefined,
        company_name:     suggModal.company_name || undefined,
      });
      toast.success(`Skill suggestion sent to ${suggModal.full_name}!`);
      setSuggModal(null);
      setSuggText("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send suggestion");
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="loading"><div className="spinner" /><span>Loading...</span></div>;
  if (!data)   return <div className="alert alert-error">Failed to load dashboard</div>;

  const { myInternships, appStats, upcomingInterviews, pendingApps } = data;

  return (
    <div>
      {/* Header */}
      <div className="section-header">
        <h1 className="section-title">Faculty Dashboard</h1>
        <span className="badge badge-faculty">Faculty</span>
      </div>

      {/* Stat cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#4f46e522" }}><Briefcase size={22} style={{ color: "#4f46e5" }} /></div>
          <div className="stat-value">{myInternships.length}</div>
          <div className="stat-label">My Internships</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#f59e0b22" }}><ClipboardList size={22} style={{ color: "#f59e0b" }} /></div>
          <div className="stat-value">{appStats?.total || 0}</div>
          <div className="stat-label">Total Applications</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#06b6d422" }}><Users size={22} style={{ color: "#06b6d4" }} /></div>
          <div className="stat-value">{students.length}</div>
          <div className="stat-label">All Students</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#10b98122" }}><Award size={22} style={{ color: "#10b981" }} /></div>
          <div className="stat-value">{appStats?.accepted || 0}</div>
          <div className="stat-label">Accepted</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 20 }}>
        {[
          { key: "students", label: "👥 All Students & Applications" },
          { key: "overview", label: "📊 My Internship Overview" },
          { key: "suggestions", label: "💡 My Sent Suggestions" },
        ].map(t => (
          <button key={t.key} className={`tab ${activeTab === t.key ? "active" : ""}`} onClick={() => setActiveTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: All Students & Applications ── */}
      {activeTab === "students" && (
        <div>
          {/* Search & filter bar */}
          <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: 2, minWidth: 200 }}>
              <Search size={15} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                className="form-control"
                style={{ paddingLeft: 32 }}
                placeholder="Search student name, enrollment, email, department…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select className="form-control" style={{ flex: 1, minWidth: 160 }} value={statusFilter} onChange={e => setStatus(e.target.value)}>
              <option value="all">All Application Statuses</option>
              <option value="pending">Pending / Applied</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="withdrawn">Withdrawn</option>
            </select>
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state">
              <Users size={40} />
              <h3>No students found</h3>
              <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Try adjusting your search or filter.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {filtered.map(student => {
                const isOpen = expanded[student.student_id];
                const appCount = student.applications.length;
                return (
                  <div key={student.student_id} className="card" style={{ padding: 0, overflow: "hidden" }}>
                    {/* Student row header */}
                    <div
                      style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "14px 18px", cursor: "pointer",
                        background: isOpen ? "rgba(79,70,229,0.06)" : "transparent",
                        borderBottom: isOpen ? "1px solid var(--dark-border)" : "none",
                      }}
                      onClick={() => toggleExpand(student.student_id)}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{
                          width: 38, height: 38, borderRadius: "50%",
                          background: "linear-gradient(135deg,#4f46e5,#818cf8)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 14, fontWeight: 700, color: "#fff", flexShrink: 0
                        }}>
                          {student.full_name?.[0]?.toUpperCase() || "S"}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{student.full_name}</div>
                          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                            {student.enrollment_no} &nbsp;·&nbsp; {student.department} &nbsp;·&nbsp; GPA: {parseFloat(student.gpa || 0).toFixed(2)}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                          {appCount} application{appCount !== 1 ? "s" : ""}
                        </span>
                        {/* Skill Suggestion button */}
                        <button
                          className="btn btn-sm"
                          style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)" }}
                          onClick={e => { e.stopPropagation(); openSuggModal(student); }}
                          title="Send Skill Improvement Suggestion"
                        >
                          <Lightbulb size={13} /> Suggest Skills
                        </button>
                        {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </div>
                    </div>

                    {/* Expanded: application history */}
                    {isOpen && (
                      <div style={{ padding: "0 18px 14px" }}>
                        {appCount === 0 ? (
                          <div style={{ padding: "18px 0", color: "var(--text-muted)", fontSize: 13, textAlign: "center" }}>
                            This student hasn't applied to any internship yet.
                          </div>
                        ) : (
                          <div style={{ marginTop: 14 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                              Application History
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                              {student.applications.map((app, idx) => (
                                <div key={app.application_id || idx} style={{
                                  padding: "12px 14px",
                                  background: "rgba(15,23,42,0.5)",
                                  border: "1px solid var(--dark-border)",
                                  borderRadius: 8,
                                  display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10
                                }}>
                                  <div style={{ flex: 1, minWidth: 200 }}>
                                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3 }}>
                                      {app.internship_title}
                                    </div>
                                    <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 6 }}>
                                      🏢 {app.company_name}
                                    </div>
                                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                                      {app.domain && <span className="badge badge-shortlisted" style={{ fontSize: 11 }}>{app.domain}</span>}
                                      {app.duration_weeks && <span style={{ fontSize: 11, color: "var(--text-muted)" }}>⏱ {app.duration_weeks}w</span>}
                                      {app.stipend !== null && app.stipend !== undefined && (
                                        <span style={{ fontSize: 11, color: "var(--success)" }}>₹{parseInt(app.stipend).toLocaleString()}/mo</span>
                                      )}
                                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                                        Applied: {new Date(app.applied_at).toLocaleDateString()}
                                      </span>
                                    </div>
                                    {app.required_skills && (
                                      <div style={{ marginTop: 6, fontSize: 11, color: "var(--text-muted)", padding: "4px 8px", background: "rgba(79,70,229,0.08)", borderRadius: 4 }}>
                                        <strong>Required Skills:</strong> {app.required_skills}
                                      </div>
                                    )}
                                    {app.review_notes && (
                                      <div style={{ marginTop: 6, fontSize: 12, color: "var(--text-secondary)", borderLeft: "3px solid var(--primary)", paddingLeft: 8 }}>
                                        <strong>Note:</strong> {app.review_notes}
                                      </div>
                                    )}
                                  </div>
                                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                                    <span className={`badge ${STATUS_COLORS[app.status] || "badge-pending-status"}`} style={{ fontSize: 12 }}>
                                      {STATUS_LABELS[app.status] || app.status}
                                    </span>
                                    <button
                                      className="btn btn-sm"
                                      style={{ fontSize: 11, background: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.25)" }}
                                      onClick={() => openSuggModal(student, app)}
                                    >
                                      <Lightbulb size={11} /> Suggest for this internship
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: My Internship Overview ── */}
      {activeTab === "overview" && (
        <div style={{ display: "grid", gap: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div className="card">
              <div className="card-header"><span className="card-title">My Internships</span></div>
              {myInternships.length === 0
                ? <div className="empty-state" style={{ padding: 24 }}><h3>No internships yet</h3></div>
                : myInternships.map(i => (
                  <div key={i.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(51,65,85,0.4)" }}>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 14 }}>{i.title}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{i.company_name} · {i.applications} apps</div>
                    </div>
                    <span className={`badge badge-${i.status}`}>{i.status}</span>
                  </div>
                ))
              }
            </div>
            <div className="card">
              <div className="card-header"><span className="card-title">Upcoming Interviews</span></div>
              {upcomingInterviews.length === 0
                ? <div className="empty-state" style={{ padding: 24 }}><h3>No upcoming interviews</h3></div>
                : upcomingInterviews.map(iv => (
                  <div key={iv.id} style={{ padding: "10px 0", borderBottom: "1px solid rgba(51,65,85,0.4)" }}>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{iv.student_name}</div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{iv.internship_title}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                      <Calendar size={11} style={{ display: "inline" }} /> {new Date(iv.interview_date).toLocaleDateString()} at {iv.interview_time?.slice(0, 5)}
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
          <div className="card">
            <div className="card-header"><span className="card-title">Pending Applications to Review</span></div>
            {pendingApps.length === 0
              ? <div className="empty-state" style={{ padding: 24 }}><h3>All caught up!</h3><p>No pending applications</p></div>
              : (
                <table><thead><tr><th>Student</th><th>Internship</th><th>Applied</th></tr></thead>
                  <tbody>{pendingApps.map(a => (
                    <tr key={a.id}>
                      <td style={{ fontWeight: 500 }}>{a.full_name}</td>
                      <td style={{ color: "var(--text-secondary)" }}>{a.title}</td>
                      <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{new Date(a.applied_at).toLocaleDateString()}</td>
                    </tr>
                  ))}</tbody>
                </table>
              )
            }
          </div>
        </div>
      )}

      {/* ── TAB: My Sent Suggestions ── */}
      {activeTab === "suggestions" && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">💡 Skill Suggestions I Sent</span>
            <button className="btn btn-sm btn-secondary" onClick={loadSuggestions}>Refresh</button>
          </div>
          {suggLoading ? <div className="loading"><div className="spinner" /></div>
            : mySuggestions.length === 0
              ? <div className="empty-state" style={{ padding: 32 }}><Lightbulb size={36} /><h3>No suggestions sent yet</h3><p style={{ color: "var(--text-muted)", fontSize: 13 }}>Go to the Students tab and click "Suggest Skills" to send your first suggestion.</p></div>
              : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
                  {mySuggestions.map((s, i) => (
                    <div key={i} style={{
                      padding: "12px 14px",
                      background: "rgba(245,158,11,0.06)",
                      border: "1px solid rgba(245,158,11,0.2)",
                      borderRadius: 8, borderLeft: "3px solid #f59e0b"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{s.student_name}</div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{s.enrollment_no && `${s.enrollment_no} · `}{s.student_email}</div>
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{new Date(s.created_at).toLocaleDateString()}</div>
                      </div>
                      <div style={{ marginTop: 8, fontSize: 13, color: "var(--text-secondary)" }}>
                        💬 {s.details?.replace(/^Suggestion: /, "")}
                      </div>
                    </div>
                  ))}
                </div>
              )
          }
        </div>
      )}

      {/* ── Skill Suggestion Modal ── */}
      {suggModal && (
        <div className="modal-overlay" onClick={() => setSuggModal(null)}>
          <div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="modal-title">💡 Skill Improvement Suggestion</span>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                  To: <strong>{suggModal.full_name}</strong>
                </div>
              </div>
              <button className="btn btn-sm btn-secondary" onClick={() => setSuggModal(null)}><X size={14} /></button>
            </div>
            <div className="modal-body">
              {suggModal.internship_title && (
                <div style={{
                  padding: "8px 12px", marginBottom: 14,
                  background: "rgba(79,70,229,0.08)", borderRadius: 8, fontSize: 12, color: "var(--text-secondary)"
                }}>
                  <strong>Internship:</strong> {suggModal.internship_title} @ {suggModal.company_name}
                  {suggModal.required_skills && (
                    <div style={{ marginTop: 4 }}><strong>Required Skills:</strong> {suggModal.required_skills}</div>
                  )}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">
                  Skill Suggestion <span style={{ color: "var(--danger)" }}>*</span>
                  <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 8, fontWeight: 400 }}>
                    (The student will see this as a notification)
                  </span>
                </label>
                <textarea
                  className="form-control"
                  rows={4}
                  value={suggText}
                  onChange={e => setSuggText(e.target.value)}
                  placeholder={
                    suggModal.domain
                      ? `e.g. "Improve your ${suggModal.domain} skills, especially ${suggModal.required_skills?.split(",")[0] || "the core tools"}`
                      : `e.g. "Practice DSA and improve problem-solving skills"\n"Learn SQL and database management"\n"Improve communication and presentation skills"`
                  }
                />
                <span style={{ fontSize: 11, color: suggText.trim().length < 5 ? "var(--danger)" : "var(--success)" }}>
                  {suggText.trim().length < 5 ? `${Math.max(0, 5 - suggText.trim().length)} more characters needed` : "✓ Ready to send"}
                </span>
              </div>

              {/* Quick suggestion chips */}
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>Quick suggestions:</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {[
                    "Practice DSA and problem solving",
                    "Improve communication skills",
                    "Learn SQL and database management",
                    `Strengthen ${suggModal.domain || "core"} fundamentals`,
                    "Work on time management and project planning",
                    suggModal.required_skills ? `Focus on: ${suggModal.required_skills.split(",").slice(0,2).join(", ")}` : null,
                  ].filter(Boolean).map(chip => (
                    <button
                      key={chip}
                      className="btn btn-sm btn-secondary"
                      style={{ fontSize: 11, padding: "3px 10px" }}
                      onClick={() => setSuggText(chip)}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSuggModal(null)}>Cancel</button>
              <button className="btn btn-primary" disabled={sending || suggText.trim().length < 5} onClick={sendSuggestion}>
                {sending ? "Sending..." : <><Send size={14} /> Send Suggestion</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
