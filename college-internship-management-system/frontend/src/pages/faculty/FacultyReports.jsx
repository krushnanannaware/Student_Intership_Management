import { useState, useEffect } from "react";
import { adminAPI } from "../../services/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function FacultyReports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(()=>{adminAPI.getFacultyReport().then(r=>setData(r.data.data)).catch(console.error).finally(()=>setLoading(false));}, []);
  if (loading) return <div className="loading"><div className="spinner"/></div>;
  if (!data) return <div className="alert alert-error">Failed to load report</div>;
  const { summary, myInternships, interviews } = data;
  return (
    <div>
      <div className="section-header"><h1 className="section-title">Faculty Reports</h1></div>
      {summary && (
        <div className="stats-grid" style={{marginBottom:24}}>
          {[["Internships Posted",summary.internships_posted,"#4f46e5"],["Total Applications",summary.total_applications,"#f59e0b"],["Shortlisted",summary.shortlisted_count,"#06b6d4"],["Accepted",summary.accepted_count,"#10b981"],["Pending",summary.pending_reviews,"#8b5cf6"],["Interviews",summary.interviews_scheduled,"#ef4444"]].map(([label,val,color])=>(
            <div className="stat-card" key={label}><div className="stat-icon" style={{background:`${color}22`}}><span style={{color,fontSize:20,fontWeight:800}}>#</span></div><div className="stat-value">{val}</div><div className="stat-label">{label}</div></div>
          ))}
        </div>
      )}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
        <div className="card">
          <div className="card-header"><span className="card-title">My Internships Performance</span></div>
          <div style={{height:250}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={myInternships}>
                <XAxis dataKey="title" tick={{fill:"#94a3b8",fontSize:9}} />
                <YAxis tick={{fill:"#94a3b8",fontSize:10}}/>
                <Tooltip contentStyle={{background:"#1e293b",border:"1px solid #334155",borderRadius:8}} />
                <Bar dataKey="applications" name="Applications" fill="#4f46e5" radius={[4,4,0,0]}/>
                <Bar dataKey="accepted" name="Accepted" fill="#10b981" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">Interview Results</span></div>
          {interviews.map((iv,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid rgba(51,65,85,0.4)"}}>
              <span style={{textTransform:"capitalize",fontSize:14}}>{iv.result}</span>
              <span style={{fontWeight:700,color:"var(--primary-light)"}}>{iv.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
