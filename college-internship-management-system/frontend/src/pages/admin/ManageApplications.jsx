import { useState, useEffect } from "react";
import { adminAPI, applicationAPI, internshipAPI, companyAPI } from "../../services/api";
import toast from "react-hot-toast";
import { ClipboardList, Search, CheckCircle, XCircle, Clock, Filter, User, Building2, Briefcase } from "lucide-react";

const STATUS_COLORS = {
  pending: "badge-pending",
  shortlisted: "badge-shortlisted",
  accepted: "badge-accepted",
  rejected: "badge-rejected",
  withdrawn: "badge-secondary",
};

const STATUS_OPTIONS = ["all", "pending", "shortlisted", "accepted", "rejected", "withdrawn"];

export default function ManageApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState([]);
  const [internships, setInternships] = useState([]);

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("");
  const [internshipFilter, setInternshipFilter] = useState("");
  const [domainFilter, setDomainFilter] = useState("");
  const [studentSearch, setStudentSearch] = useState("");

  // Status update modal
  const [updating, setUpdating] = useState(null); // application being updated
  const [reviewNotes, setReviewNotes] = useState("");
  const [savingStatus, setSavingStatus] = useState(false);

  const loadData = () => {
    setLoading(true);
    const params = {};
    if (statusFilter && statusFilter !== "all") params.status = statusFilter;
    if (companyFilter) params.company_id = companyFilter;
    if (internshipFilter) params.internship_id = internshipFilter;
    if (domainFilter) params.domain = domainFilter;
    if (studentSearch) params.student_search = studentSearch;

    Promise.all([
      adminAPI.getAdminApplications(params),
      companyAPI.getAll({}),
      internshipAPI.getAll({ limit: 200 }),
    ]).then(([appRes, compRes, intRes]) => {
      setApplications(appRes.data.data || []);
      setCompanies(compRes.data.data || []);
      setInternships(intRes.data.data || []);
    }).catch(() => toast.error("Failed to load applications"))
      .finally(() => setLoading(false));
  };

  useEffect(loadData, [statusFilter, companyFilter, internshipFilter, domainFilter, studentSearch]);

  const openStatusModal = (app) => {
    setUpdating(app);
    setReviewNotes(app.review_notes || "");
  };

  const updateStatus = async (newStatus) => {
    if (!updating) return;
    setSavingStatus(true);
    try {
      await applicationAPI.updateStatus(updating.id, { status: newStatus, review_notes: reviewNotes });
      toast.success(`Application ${newStatus}!`);
      setUpdating(null);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    } finally {
      setSavingStatus(false);
    }
  };

  // Unique domains from fetched applications
  const domains = [...new Set(applications.map(a => a.domain))].filter(Boolean);

  const counts = {
    all: applications.length,
    pending: applications.filter(a => a.status === "pending").length,
    shortlisted: applications.filter(a => a.status === "shortlisted").length,
    accepted: applications.filter(a => a.status === "accepted").length,
    rejected: applications.filter(a => a.status === "rejected").length,
  };

  return (
    <div>
      <div className="section-header">
        <h1 className="section-title">Manage Applications</h1>
        <span style={{color:"var(--text-muted)",fontSize:13}}>{applications.length} applications</span>
      </div>

      {/* Stats row */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:12,marginBottom:20}}>
        {[
          { label:"Total", value: applications.length, color:"#4f46e5", icon: ClipboardList },
          { label:"Pending", value: counts.pending, color:"#f59e0b", icon: Clock },
          { label:"Shortlisted", value: counts.shortlisted, color:"#06b6d4", icon: Filter },
          { label:"Accepted", value: counts.accepted, color:"#10b981", icon: CheckCircle },
          { label:"Rejected", value: counts.rejected, color:"#ef4444", icon: XCircle },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{padding:"12px 16px"}}>
            <div className="stat-icon" style={{background:`${s.color}22`,width:36,height:36}}>
              <s.icon size={18} style={{color:s.color}}/>
            </div>
            <div className="stat-value" style={{fontSize:22}}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card" style={{marginBottom:20,padding:16}}>
        <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
          <div style={{position:"relative",flex:2,minWidth:180}}>
            <Search size={14} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"var(--text-muted)"}}/>
            <input
              className="form-control" style={{paddingLeft:32}}
              placeholder="Search student name, email or ID..."
              value={studentSearch} onChange={e => setStudentSearch(e.target.value)}
            />
          </div>
          <select className="form-control" style={{flex:1,minWidth:140}} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
          </select>
          <select className="form-control" style={{flex:1,minWidth:140}} value={companyFilter} onChange={e => setCompanyFilter(e.target.value)}>
            <option value="">All Companies</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className="form-control" style={{flex:1,minWidth:140}} value={internshipFilter} onChange={e => setInternshipFilter(e.target.value)}>
            <option value="">All Internships</option>
            {internships.map(i => <option key={i.id} value={i.id}>{i.title}</option>)}
          </select>
          <select className="form-control" style={{flex:1,minWidth:130}} value={domainFilter} onChange={e => setDomainFilter(e.target.value)}>
            <option value="">All Domains</option>
            {domains.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <button className="btn btn-secondary btn-sm" onClick={() => {setStatusFilter("all");setCompanyFilter("");setInternshipFilter("");setDomainFilter("");setStudentSearch("");}}>
            Clear
          </button>
        </div>
      </div>

      {loading ? <div className="loading"><div className="spinner"/></div> : (
        <>
          {applications.length === 0 ? (
            <div className="empty-state">
              <ClipboardList size={40}/>
              <h3>No applications found</h3>
              <p style={{color:"var(--text-muted)",fontSize:13}}>Try adjusting your filters.</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Internship</th>
                    <th>Company</th>
                    <th>Domain</th>
                    <th>Duration / Stipend</th>
                    <th>Applied</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map(a => (
                    <tr key={a.id}>
                      <td>
                        <div style={{fontWeight:600,fontSize:14}}>{a.student_name}</div>
                        <div style={{fontSize:11,color:"var(--text-muted)"}}>{a.student_email}</div>
                        {a.enrollment_no && <div style={{fontSize:11,color:"var(--text-muted)"}}>ID: {a.enrollment_no}</div>}
                        {a.student_phone && <div style={{fontSize:11,color:"var(--text-muted)"}}>{a.student_phone}</div>}
                      </td>
                      <td style={{fontWeight:500}}>{a.internship_title}</td>
                      <td style={{fontSize:13,color:"var(--text-secondary)"}}>{a.company_name}</td>
                      <td><span className="badge badge-shortlisted">{a.domain}</span></td>
                      <td style={{fontSize:12}}>
                        <div>{a.duration_weeks}w</div>
                        <div style={{color:"var(--success)"}}>₹{parseInt(a.stipend||0).toLocaleString()}</div>
                      </td>
                      <td style={{fontSize:12,color:"var(--text-muted)"}}>{new Date(a.applied_at).toLocaleDateString()}</td>
                      <td>
                        <span className={`badge ${STATUS_COLORS[a.status] || "badge-pending"}`} style={{textTransform:"capitalize"}}>
                          {a.status}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => openStatusModal(a)}
                          style={{whiteSpace:"nowrap"}}
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Status Update Modal */}
      {updating && (
        <div className="modal-overlay" onClick={() => setUpdating(null)}>
          <div className="modal" style={{maxWidth:520}} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="modal-title">Manage Application</span>
                <div style={{fontSize:12,color:"var(--text-muted)",marginTop:2}}>{updating.student_name} → {updating.internship_title}</div>
              </div>
              <button className="btn btn-sm btn-secondary" onClick={() => setUpdating(null)}>✕</button>
            </div>
            <div className="modal-body">
              {/* Student Info */}
              <div style={{padding:"12px 14px",background:"rgba(51,65,85,0.4)",borderRadius:8,marginBottom:16}}>
                <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
                  <div>
                    <div style={{fontSize:11,color:"var(--text-muted)",marginBottom:2}}>Student</div>
                    <div style={{fontWeight:600}}>{updating.student_name}</div>
                    <div style={{fontSize:12,color:"var(--text-secondary)"}}>{updating.student_email}</div>
                    {updating.enrollment_no && <div style={{fontSize:12,color:"var(--text-muted)"}}>ID: {updating.enrollment_no}</div>}
                    {updating.student_phone && <div style={{fontSize:12,color:"var(--text-muted)"}}>{updating.student_phone}</div>}
                  </div>
                  <div>
                    <div style={{fontSize:11,color:"var(--text-muted)",marginBottom:2}}>Internship</div>
                    <div style={{fontWeight:600}}>{updating.internship_title}</div>
                    <div style={{fontSize:12,color:"var(--text-secondary)"}}>{updating.company_name}</div>
                    <div style={{fontSize:12,color:"var(--text-muted)"}}>{updating.domain} · {updating.duration_weeks}w · ₹{parseInt(updating.stipend||0).toLocaleString()}</div>
                  </div>
                </div>
                <div style={{marginTop:12}}>
                  <div style={{fontSize:11,color:"var(--text-muted)",marginBottom:4}}>Current Status</div>
                  <span className={`badge ${STATUS_COLORS[updating.status] || "badge-pending"}`} style={{textTransform:"capitalize",fontSize:13}}>
                    {updating.status}
                  </span>
                </div>
              </div>

              {/* Review notes */}
              <div className="form-group">
                <label className="form-label">Review Notes (optional)</label>
                <textarea
                  className="form-control" rows={3}
                  value={reviewNotes}
                  onChange={e => setReviewNotes(e.target.value)}
                  placeholder="Add a note for the student (e.g. reason for rejection, next steps)..."
                />
              </div>

              {/* Action buttons */}
              <div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:4}}>
                <button
                  className="btn btn-success"
                  style={{flex:1,justifyContent:"center"}}
                  disabled={savingStatus || updating.status === "accepted"}
                  onClick={() => updateStatus("accepted")}
                >
                  <CheckCircle size={15}/> Accept
                </button>
                <button
                  className="btn btn-danger"
                  style={{flex:1,justifyContent:"center"}}
                  disabled={savingStatus || updating.status === "rejected"}
                  onClick={() => updateStatus("rejected")}
                >
                  <XCircle size={15}/> Reject
                </button>
                <button
                  className="btn btn-secondary"
                  style={{flex:1,justifyContent:"center"}}
                  disabled={savingStatus || updating.status === "shortlisted"}
                  onClick={() => updateStatus("shortlisted")}
                >
                  Shortlist
                </button>
                <button
                  className="btn btn-secondary"
                  style={{flex:1,justifyContent:"center"}}
                  disabled={savingStatus || updating.status === "pending"}
                  onClick={() => updateStatus("pending")}
                >
                  Set Pending
                </button>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setUpdating(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
