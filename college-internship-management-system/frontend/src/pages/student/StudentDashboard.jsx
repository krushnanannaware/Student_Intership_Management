import { useState, useEffect } from "react";
import { studentAPI } from "../../services/api";
import { ClipboardList, CheckCircle, XCircle, Clock, Calendar, Star } from "lucide-react";
import { Link } from "react-router-dom";

export default function StudentDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(()=>{ studentAPI.getDashboard().then(r=>setData(r.data.data)).catch(console.error).finally(()=>setLoading(false)); },[]);
  if (loading) return <div className="loading"><div className="spinner"/><span>Loading dashboard...</span></div>;
  if (!data) return <div className="alert alert-error">Failed to load dashboard</div>;
  const { stats, recentApplications, upcomingInterviews, notifications } = data;
  const statusBadge = (s) => <span className={`badge badge-${s}`}>{s}</span>;
  return (
    <div>
      <div className="section-header" style={{marginBottom:24}}>
        <div><h1 className="section-title">Student Dashboard</h1><p style={{color:"var(--text-muted)",fontSize:13}}>Your internship journey at a glance</p></div>
        <span className="badge badge-student">Student</span>
      </div>
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-icon" style={{background:"#4f46e522"}}><ClipboardList size={22} style={{color:"#4f46e5"}}/></div><div className="stat-value">{stats?.total_applications||0}</div><div className="stat-label">Total Applications</div></div>
        <div className="stat-card"><div className="stat-icon" style={{background:"#f59e0b22"}}><Clock size={22} style={{color:"#f59e0b"}}/></div><div className="stat-value">{stats?.pending||0}</div><div className="stat-label">Pending</div></div>
        <div className="stat-card"><div className="stat-icon" style={{background:"#06b6d422"}}><Star size={22} style={{color:"#06b6d4"}}/></div><div className="stat-value">{stats?.shortlisted||0}</div><div className="stat-label">Shortlisted</div></div>
        <div className="stat-card"><div className="stat-icon" style={{background:"#10b98122"}}><CheckCircle size={22} style={{color:"#10b981"}}/></div><div className="stat-value">{stats?.accepted||0}</div><div className="stat-label">Accepted</div></div>
        <div className="stat-card"><div className="stat-icon" style={{background:"#ef444422"}}><XCircle size={22} style={{color:"#ef4444"}}/></div><div className="stat-value">{stats?.rejected||0}</div><div className="stat-label">Rejected</div></div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent Applications</span>
            <Link to="/student/applications" className="btn btn-sm btn-secondary">View All</Link>
          </div>
          {recentApplications.length === 0 ? (
            <div className="empty-state" style={{padding:24}}>
              <ClipboardList size={28}/><h3>No applications yet</h3>
              <Link to="/student/internships" className="btn btn-primary" style={{marginTop:12}}>Browse Internships</Link>
            </div>
          ) : recentApplications.map(a=>(
            <div key={a.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid rgba(51,65,85,0.4)"}}>
              <div>
                <div style={{fontWeight:500,fontSize:14}}>{a.title}</div>
                <div style={{fontSize:11,color:"var(--text-muted)"}}>{a.company} · {new Date(a.applied_at).toLocaleDateString()}</div>
              </div>
              {statusBadge(a.status)}
            </div>
          ))}
        </div>
        <div>
          <div className="card" style={{marginBottom:20}}>
            <div className="card-header">
              <span className="card-title">Upcoming Interviews</span>
              <Link to="/student/interviews" className="btn btn-sm btn-secondary">View All</Link>
            </div>
            {upcomingInterviews.length === 0 ? <div className="empty-state" style={{padding:24}}><Calendar size={28}/><h3>No upcoming interviews</h3></div>
            : upcomingInterviews.map(iv=>(
              <div key={iv.id} style={{padding:"10px 0",borderBottom:"1px solid rgba(51,65,85,0.4)"}}>
                <div style={{fontWeight:500,fontSize:14}}>{iv.internship_title}</div>
                <div style={{fontSize:12,color:"var(--text-secondary)"}}>{iv.company_name}</div>
                <div style={{display:"flex",gap:16,marginTop:4}}>
                  <span style={{fontSize:11,color:"var(--primary-light)"}}><Calendar size={11} style={{display:"inline"}}/> {new Date(iv.interview_date).toLocaleDateString()}</span>
                  {iv.meeting_link && <a href={iv.meeting_link} target="_blank" rel="noreferrer" style={{fontSize:11,color:"var(--success)"}}>Join Meeting ↗</a>}
                </div>
              </div>
            ))}
          </div>
          <div className="card">
            <div className="card-header"><span className="card-title">Quick Actions</span></div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              <Link to="/student/internships" className="btn btn-primary" style={{justifyContent:"flex-start"}}>🔍 Browse Internships</Link>
              <Link to="/student/applications" className="btn btn-secondary" style={{justifyContent:"flex-start"}}>📋 My Applications</Link>
              <Link to="/student/profile" className="btn btn-secondary" style={{justifyContent:"flex-start"}}>👤 Update Profile</Link>
              <Link to="/student/feedback" className="btn btn-secondary" style={{justifyContent:"flex-start"}}>⭐ Submit Feedback</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
