import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { internshipAPI, applicationAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import { MapPin, Clock, DollarSign, Calendar, Users, Briefcase } from "lucide-react";

export default function InternshipDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [internship, setInternship] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [form, setForm] = useState({ cover_letter:"", qualifications:"", resume:null });

  useEffect(()=>{ internshipAPI.getById(id).then(r=>setInternship(r.data.data)).catch(()=>toast.error("Not found")).finally(()=>setLoading(false)); },[id]);

  const apply = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("internship_id", id);
    fd.append("cover_letter", form.cover_letter);
    fd.append("qualifications", form.qualifications);
    if (form.resume) fd.append("resume", form.resume);
    try { await applicationAPI.apply(fd); toast.success("Applied successfully!"); navigate("/student/applications"); }
    catch(err) { toast.error(err.response?.data?.message||"Failed"); }
  };

  if (loading) return <div className="loading"><div className="spinner"/></div>;
  if (!internship) return <div className="alert alert-error">Internship not found</div>;

  return (
    <div style={{maxWidth:800}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24}}>
        <div>
          <h1 style={{fontSize:24,fontWeight:800,marginBottom:4}}>{internship.title}</h1>
          <div style={{fontSize:16,color:"var(--text-secondary)"}}>{internship.company_name}</div>
        </div>
        <span className={`badge badge-${internship.status}`} style={{fontSize:13}}>{internship.status}</span>
      </div>
      <div className="card" style={{marginBottom:20}}>
        <div style={{display:"flex",flexWrap:"wrap",gap:24,marginBottom:16}}>
          {[["💰",`₹${parseInt(internship.stipend).toLocaleString()}/month`,"var(--success)"],["📍",internship.location,"var(--text-secondary)"],["⏱",`${internship.duration_weeks} weeks`,"var(--text-secondary)"],["📅",`Deadline: ${new Date(internship.application_deadline).toLocaleDateString()}`,"var(--warning)"],["👥",`${internship.vacancies} vacancies`,"var(--text-secondary)"],["📊",`${internship.application_count} applied`,"var(--text-secondary)"]].map(([icon,text,color])=>(
            <div key={text} style={{display:"flex",alignItems:"center",gap:8,fontSize:14,color}}><span style={{fontSize:16}}>{icon}</span>{text}</div>
          ))}
        </div>
        <div style={{borderTop:"1px solid var(--dark-border)",paddingTop:16}}>
          <h3 style={{fontSize:15,fontWeight:600,marginBottom:8}}>Description</h3>
          <p style={{fontSize:14,color:"var(--text-secondary)",lineHeight:1.6}}>{internship.description}</p>
        </div>
        {internship.requirements && (
          <div style={{marginTop:16}}>
            <h3 style={{fontSize:15,fontWeight:600,marginBottom:8}}>Requirements</h3>
            <p style={{fontSize:14,color:"var(--text-secondary)"}}>{internship.requirements}</p>
          </div>
        )}
        <div style={{marginTop:16,padding:12,background:"var(--dark)",borderRadius:"var(--radius-sm)"}}>
          <div style={{fontSize:13,fontWeight:600,marginBottom:8}}>Company Contact</div>
          <div style={{fontSize:13,color:"var(--text-secondary)"}}>{internship.contact_person} · {internship.contact_email}</div>
          {internship.website && <a href={internship.website} target="_blank" rel="noreferrer" style={{fontSize:13,color:"var(--primary-light)"}}>{internship.website}</a>}
        </div>
      </div>
      {user?.role === "student" && internship.status === "approved" && !applying && (
        <button className="btn btn-primary" onClick={()=>setApplying(true)} style={{fontSize:15,padding:"12px 24px"}}>Apply for This Internship</button>
      )}
      {applying && (
        <div className="card">
          <h2 style={{fontSize:16,fontWeight:700,marginBottom:16}}>Submit Application</h2>
          <form onSubmit={apply}>
            <div className="form-group"><label className="form-label">Cover Letter</label><textarea className="form-control" rows={4} value={form.cover_letter} onChange={e=>setForm({...form,cover_letter:e.target.value})} placeholder="Why are you the perfect candidate?" /></div>
            <div className="form-group"><label className="form-label">Qualifications & Skills</label><textarea className="form-control" rows={3} value={form.qualifications} onChange={e=>setForm({...form,qualifications:e.target.value})} placeholder="Relevant skills, certifications, projects..." /></div>
            <div className="form-group"><label className="form-label">Resume (PDF, max 5MB)</label><input className="form-control" type="file" accept=".pdf" onChange={e=>setForm({...form,resume:e.target.files[0]})} /></div>
            <div className="btn-group">
              <button type="submit" className="btn btn-primary">Submit Application</button>
              <button type="button" className="btn btn-secondary" onClick={()=>setApplying(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
