import { useState, useEffect } from "react";
import { interviewAPI } from "../../services/api";
import { Calendar } from "lucide-react";

export default function MyInterviews() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(()=>{ interviewAPI.getAll({}).then(r=>setInterviews(r.data.data||[])).catch(console.error).finally(()=>setLoading(false)); },[]);
  const upcoming = interviews.filter(i=>!i.is_cancelled && new Date(`${i.interview_date}T${i.interview_time}`) >= new Date());
  const past = interviews.filter(i=>i.is_cancelled || new Date(`${i.interview_date}T${i.interview_time}`) < new Date());
  const InterviewCard = ({iv}) => (
    <div className="card" style={{marginBottom:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div>
          <div style={{fontWeight:600,fontSize:15}}>{iv.internship_title}</div>
          <div style={{fontSize:13,color:"var(--text-secondary)",marginBottom:8}}>{iv.company_name}</div>
          <div style={{display:"flex",gap:20,flexWrap:"wrap"}}>
            <span style={{fontSize:13}}><Calendar size={13} style={{display:"inline",marginRight:4}}/>  {new Date(iv.interview_date).toLocaleDateString("en-IN", {weekday:"short",day:"numeric",month:"short",year:"numeric"})}</span>
            <span style={{fontSize:13,color:"var(--text-secondary)"}}> Time: {iv.interview_time?.slice(0,5)}</span>
            <span style={{fontSize:13,color:"var(--text-secondary)"}}>Interviewer: {iv.interviewer}</span>
          </div>
        </div>
        <span className={`badge badge-${iv.result}`}>{iv.result}</span>
      </div>
      {iv.notes && <p style={{fontSize:12,color:"var(--text-muted)",marginTop:8,padding:"8px",background:"var(--dark)",borderRadius:6}}>{iv.notes}</p>}
      {iv.meeting_link && !iv.is_cancelled && (
        <div style={{marginTop:12}}>
          <a href={iv.meeting_link} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">🎥 Join Meeting</a>
        </div>
      )}
      {iv.result_comments && <div style={{marginTop:8,fontSize:12,color:"var(--success)"}}>Result Comments: {iv.result_comments}</div>}
    </div>
  );
  if (loading) return <div className="loading"><div className="spinner"/></div>;
  return (
    <div>
      <div className="section-header"><h1 className="section-title">My Interviews</h1></div>
      <h2 style={{fontSize:15,fontWeight:600,marginBottom:12,color:"var(--text-secondary)"}}>Upcoming ({upcoming.length})</h2>
      {upcoming.length === 0 ? <div className="empty-state"><Calendar size={32}/><h3>No upcoming interviews</h3></div> : upcoming.map(iv=><InterviewCard key={iv.id} iv={iv}/>)}
      {past.length > 0 && <>
        <h2 style={{fontSize:15,fontWeight:600,margin:"20px 0 12px",color:"var(--text-secondary)"}}>Past Interviews ({past.length})</h2>
        {past.map(iv=><InterviewCard key={iv.id} iv={iv}/>)}
      </>}
    </div>
  );
}
