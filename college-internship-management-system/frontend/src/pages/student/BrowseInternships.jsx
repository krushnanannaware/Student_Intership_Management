import { useState, useEffect } from "react";
import { internshipAPI, applicationAPI } from "../../services/api";
import toast from "react-hot-toast";
import { Search, Briefcase, DollarSign, MapPin, Clock } from "lucide-react";
import { Link } from "react-router-dom";

export default function BrowseInternships() {
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [domain, setDomain] = useState("");
  const [minStipend, setMinStipend] = useState("");
  const [applying, setApplying] = useState(null);
  const [appForm, setAppForm] = useState({ cover_letter:"", qualifications:"", resume:null });
  const [submitting, setSubmitting] = useState(false);

  const loadInternships = () => {
    setLoading(true);
    internshipAPI.getAll({ search, domain, min_stipend: minStipend })
      .then(r => setInternships(r.data.data || []))
      .catch(() => toast.error("Failed to load internships"))
      .finally(() => setLoading(false));
  };
  useEffect(loadInternships, [search, domain, minStipend]);

  const apply = async (e) => {
    e.preventDefault();
    if (!applying) return;

    // ── Frontend validation ──
    if (!appForm.cover_letter.trim()) {
      toast.error("Cover letter is required.", { id: "apply-err" }); return;
    }
    if (appForm.cover_letter.trim().length < 50) {
      toast.error("Cover letter must be at least 50 characters.", { id: "apply-err" }); return;
    }
    if (!appForm.qualifications.trim()) {
      toast.error("Qualifications & Skills are required.", { id: "apply-err" }); return;
    }
    if (appForm.qualifications.trim().length < 20) {
      toast.error("Please describe your qualifications in at least 20 characters.", { id: "apply-err" }); return;
    }

    setSubmitting(true);
    const fd = new FormData();
    fd.append("internship_id", applying.id);
    fd.append("cover_letter", appForm.cover_letter.trim());
    fd.append("qualifications", appForm.qualifications.trim());
    if (appForm.resume) fd.append("resume", appForm.resume);
    try {
      await applicationAPI.apply(fd);
      toast.success("Application submitted successfully!");
      setInternships(prev => prev.filter(i => i.id !== applying.id));
      setApplying(null);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to apply";
      toast.error(msg, { id: "apply-err" });
    } finally {
      setSubmitting(false);
    }
  };

  const domains = [...new Set(internships.map(i => i.domain))].filter(Boolean);

  return (
    <div>
      <div className="section-header">
        <h1 className="section-title">Browse Internships</h1>
        <span style={{color:"var(--text-muted)",fontSize:13}}>{internships.length} available</span>
      </div>
      <div className="search-bar">
        <div className="search-input" style={{flex:2}}>
          <Search className="search-icon" size={16}/>
          <input className="form-control" placeholder="Search by title or description..." value={search} onChange={e=>setSearch(e.target.value)} style={{paddingLeft:40}}/>
        </div>
        <select className="form-control" style={{flex:1,minWidth:150}} value={domain} onChange={e=>setDomain(e.target.value)}>
          <option value="">All Domains</option>
          {domains.map(d=><option key={d} value={d}>{d}</option>)}
        </select>
        <input className="form-control" style={{flex:1,minWidth:140}} type="number" placeholder="Min. Stipend ₹" value={minStipend} onChange={e=>setMinStipend(e.target.value)} />
      </div>
      {loading ? <div className="loading"><div className="spinner"/></div> : (
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:20}}>
          {internships.length === 0 ? (
            <div className="empty-state" style={{gridColumn:"1/-1"}}>
              <Briefcase size={40}/>
              <h3>No internships available</h3>
              <p style={{color:"var(--text-muted)",fontSize:13,marginTop:8}}>
                You have already applied to all available internships, or none are open yet.<br/>
                Check <strong>My Applications</strong> to track your application status.
              </p>
            </div>
          ) : internships.map(i=>(
            <div key={i.id} className="card" style={{display:"flex",flexDirection:"column"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                <div>
                  <h3 style={{fontSize:15,fontWeight:700,marginBottom:4}}>{i.title}</h3>
                  <div style={{fontSize:13,color:"var(--text-secondary)"}}>{i.company_name}</div>
                </div>
                <span className="badge badge-shortlisted">{i.domain}</span>
              </div>
              <p style={{fontSize:13,color:"var(--text-muted)",marginBottom:12,flex:1,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:3,WebkitBoxOrient:"vertical"}}>{i.description}</p>
              <div style={{display:"flex",gap:16,marginBottom:12,flexWrap:"wrap"}}>
                <span style={{fontSize:12,color:"var(--success)",display:"flex",alignItems:"center",gap:4}}><DollarSign size={12}/> ₹{parseInt(i.stipend).toLocaleString()}/mo</span>
                <span style={{fontSize:12,color:"var(--text-secondary)",display:"flex",alignItems:"center",gap:4}}><MapPin size={12}/> {i.location}</span>
                <span style={{fontSize:12,color:"var(--text-secondary)",display:"flex",alignItems:"center",gap:4}}><Clock size={12}/> {i.duration_weeks} weeks</span>
              </div>
              {i.requirements && (
                <div style={{fontSize:11,color:"var(--text-muted)",marginBottom:8,padding:"6px 8px",background:"rgba(79,70,229,0.08)",borderRadius:6}}>
                  <strong>Required Skills:</strong> {i.requirements}
                </div>
              )}
              <div style={{fontSize:11,color:"var(--text-muted)",marginBottom:12}}>Deadline: {new Date(i.application_deadline).toLocaleDateString()} · {i.application_count} applied</div>
              <div style={{display:"flex",gap:8}}>
                <Link to={`/internships/${i.id}`} className="btn btn-secondary btn-sm" style={{flex:1,justifyContent:"center"}}>View Details</Link>
                <button className="btn btn-primary btn-sm" style={{flex:1,justifyContent:"center"}} onClick={()=>{setApplying(i);setAppForm({cover_letter:"",qualifications:"",resume:null});}}>Apply Now</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {applying && (
        <div className="modal-overlay" onClick={()=>setApplying(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="modal-title">Apply for {applying.title}</span>
                <div style={{fontSize:12,color:"var(--text-muted)",marginTop:2}}>{applying.company_name}</div>
              </div>
              <button className="btn btn-sm btn-secondary" onClick={()=>setApplying(null)}>✕</button>
            </div>
            <form onSubmit={apply}>
              <div className="modal-body">
                <div className="form-group"><label className="form-label">Cover Letter <span style={{color:"var(--danger)"}}>*</span></label>
                  <textarea className="form-control" rows={4} required minLength={50} value={appForm.cover_letter} onChange={e=>setAppForm({...appForm,cover_letter:e.target.value})} placeholder="Tell them why you are the perfect candidate... (min. 50 characters)" />
                  <span style={{fontSize:11,color:"var(--text-muted)"}}>{appForm.cover_letter.length < 50 ? `${50 - appForm.cover_letter.length} more characters needed` : "✓ Good"}</span>
                </div>
                <div className="form-group"><label className="form-label">Qualifications & Skills <span style={{color:"var(--danger)"}}>*</span></label>
                  <textarea className="form-control" rows={3} required minLength={20} value={appForm.qualifications} onChange={e=>setAppForm({...appForm,qualifications:e.target.value})} placeholder="Your relevant skills, certifications, projects... (min. 20 characters)" />
                  <span style={{fontSize:11,color:"var(--text-muted)"}}>{appForm.qualifications.length < 20 ? `${20 - appForm.qualifications.length} more characters needed` : "✓ Good"}</span>
                </div>
                <div className="form-group">
                  <label className="form-label">Resume (PDF, max 5MB)</label>
                  <input className="form-control" type="file" accept=".pdf" onChange={e=>setAppForm({...appForm,resume:e.target.files[0]})} />
                  <span style={{fontSize:11,color:"var(--text-muted)"}}>If you have already uploaded a resume, you can skip this</span>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={()=>setApplying(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? "Submitting..." : "Submit Application"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
