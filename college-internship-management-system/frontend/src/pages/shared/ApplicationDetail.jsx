import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { applicationAPI } from "../../services/api";

export default function ApplicationDetail() {
  const { id } = useParams();
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(()=>{ applicationAPI.getById(id).then(r=>setApp(r.data.data)).catch(console.error).finally(()=>setLoading(false)); },[id]);
  if (loading) return <div className="loading"><div className="spinner"/></div>;
  if (!app) return <div className="alert alert-error">Application not found</div>;
  return (
    <div style={{maxWidth:700}}>
      <h1 style={{fontSize:22,fontWeight:800,marginBottom:4}}>{app.internship_title}</h1>
      <div style={{fontSize:15,color:"var(--text-secondary)",marginBottom:24}}>{app.company_name}</div>
      <div className="card" style={{marginBottom:16}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          {[["Student",app.student_name],["Enrollment No",app.enrollment_no],["GPA",app.gpa],["Department",app.department_name],["Status",app.status],["Applied",new Date(app.applied_at).toLocaleDateString()]].map(([k,v])=>(
            <div key={k}><div style={{fontSize:11,color:"var(--text-muted)"}}>{k}</div><div style={{fontWeight:500,marginTop:2}}>{k==="Status"?<span className={`badge badge-${v}`}>{v}</span>:v||"—"}</div></div>
          ))}
        </div>
      </div>
      {app.cover_letter && <div className="card" style={{marginBottom:16}}><h3 style={{fontSize:14,fontWeight:600,marginBottom:8}}>Cover Letter</h3><p style={{fontSize:13,color:"var(--text-secondary)",lineHeight:1.6}}>{app.cover_letter}</p></div>}
      {app.review_notes && <div className="card"><h3 style={{fontSize:14,fontWeight:600,marginBottom:8}}>Review Notes</h3><p style={{fontSize:13,color:"var(--text-secondary)"}}>{app.review_notes}</p></div>}
    </div>
  );
}
