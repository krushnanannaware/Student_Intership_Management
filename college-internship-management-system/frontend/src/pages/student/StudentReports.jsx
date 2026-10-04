import { useState, useEffect } from "react";
import { adminAPI } from "../../services/api";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ["#f59e0b","#06b6d4","#10b981","#ef4444","#94a3b8"];
const LABELS = ["pending","shortlisted","accepted","rejected","withdrawn"];

export default function StudentReports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(()=>{adminAPI.getStudentReport().then(r=>setData(r.data.data)).catch(console.error).finally(()=>setLoading(false));}, []);
  if (loading) return <div className="loading"><div className="spinner"/></div>;
  if (!data) return <div className="alert alert-error">Failed to load report</div>;
  const { appSummary, timeline, interviews, evals } = data;
  const pieData = LABELS.map((l,i)=>({name:l, value:appSummary[l]||0, color:COLORS[i]})).filter(d=>d.value>0);
  return (
    <div>
      <div className="section-header"><h1 className="section-title">My Reports</h1></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:24}}>
        <div className="card">
          <div className="card-header"><span className="card-title">Application Summary</span></div>
          <div style={{height:220}}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart><Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({name,value})=>`${name}: ${value}`}>
                {pieData.map((d,i)=><Cell key={i} fill={d.color}/>)}
              </Pie><Tooltip contentStyle={{background:"#1e293b",border:"1px solid #334155",borderRadius:8}}/></PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">Application Stats</span></div>
          {[["Total",appSummary.total,"#4f46e5"],["Pending",appSummary.pending,"#f59e0b"],["Shortlisted",appSummary.shortlisted,"#06b6d4"],["Accepted",appSummary.accepted,"#10b981"],["Rejected",appSummary.rejected,"#ef4444"]].map(([label,val,color])=>(
            <div key={label} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid rgba(51,65,85,0.4)"}}>
              <span style={{fontSize:14}}>{label}</span><span style={{fontWeight:700,color}}>{val||0}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <div className="card-header"><span className="card-title">Application Timeline</span></div>
        <table><thead><tr><th>Internship</th><th>Company</th><th>Stipend</th><th>Applied</th><th>Status</th></tr></thead>
        <tbody>{timeline.length===0 ? <tr><td colSpan={5}><div className="empty-state" style={{padding:24}}><h3>No applications</h3></div></td></tr>
        : timeline.map((a,i)=>(
          <tr key={i}><td style={{fontWeight:500}}>{a.title}</td><td style={{fontSize:13,color:"var(--text-secondary)"}}>{a.company}</td>
          <td style={{color:"var(--success)"}}>₹{parseInt(a.stipend||0).toLocaleString()}</td>
          <td style={{fontSize:12,color:"var(--text-muted)"}}>{new Date(a.applied_at).toLocaleDateString()}</td>
          <td><span className={`badge badge-${a.status}`}>{a.status}</span></td></tr>
        ))}</tbody></table>
      </div>
    </div>
  );
}
