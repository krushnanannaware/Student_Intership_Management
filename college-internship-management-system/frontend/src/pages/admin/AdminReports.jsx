import { useState, useEffect } from "react";
import { adminAPI } from "../../services/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function AdminReports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { adminAPI.getAdminReport().then(r=>setData(r.data.data)).catch(console.error).finally(()=>setLoading(false)); }, []);
  if (loading) return <div className="loading"><div className="spinner"/><span>Generating report...</span></div>;
  if (!data) return <div className="alert alert-error">Failed to load report</div>;
  const { placementSummary, internshipStats, companyStats, studentEvals } = data;
  return (
    <div>
      <div className="section-header"><h1 className="section-title">Admin Reports</h1></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:24}}>
        <div className="card">
          <div className="card-header"><span className="card-title">Placement Summary by Department</span></div>
          <div style={{height:250}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={placementSummary}>
                <XAxis dataKey="department" tick={{fill:"#94a3b8",fontSize:9}} />
                <YAxis tick={{fill:"#94a3b8",fontSize:10}} />
                <Tooltip contentStyle={{background:"#1e293b",border:"1px solid #334155",borderRadius:8}} />
                <Bar dataKey="placed_students" name="Placed" fill="#10b981" radius={[4,4,0,0]} />
                <Bar dataKey="total_students" name="Total" fill="#4f46e5" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">Top Internships by Applications</span></div>
          <div style={{maxHeight:250,overflowY:"auto"}}>
            {internshipStats.slice(0,8).map((i,idx)=>(
              <div key={idx} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid rgba(51,65,85,0.4)",fontSize:13}}>
                <div><div style={{fontWeight:500}}>{i.title}</div><div style={{fontSize:11,color:"var(--text-muted)"}}>{i.company_name}</div></div>
                <div style={{textAlign:"right"}}>
                  <span className="badge badge-pending">{i.total_applications} apps</span>
                  <div style={{fontSize:11,color:"var(--success)",marginTop:2}}>{i.accepted_count} accepted</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
        <div className="card">
          <div className="card-header"><span className="card-title">Company Statistics</span></div>
          <table><thead><tr><th>Company</th><th>Internships</th><th>Applicants</th><th>Hired</th><th>Avg Rating</th></tr></thead>
          <tbody>{companyStats.map((c,i)=>(
            <tr key={i}><td style={{fontWeight:500}}>{c.company_name}</td><td>{c.total_internships}</td><td>{c.total_applications}</td><td style={{color:"var(--success)"}}>{c.accepted_applications}</td><td>{c.avg_student_rating ? parseFloat(c.avg_student_rating).toFixed(1) : "—"} ⭐</td></tr>
          ))}</tbody></table>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">Top Performing Students</span></div>
          <table><thead><tr><th>Student</th><th>Dept</th><th>GPA</th><th>Eval Score</th><th>Status</th></tr></thead>
          <tbody>{studentEvals.slice(0,8).map((s,i)=>(
            <tr key={i}><td style={{fontWeight:500}}>{s.full_name}</td><td style={{fontSize:12,color:"var(--text-muted)"}}>{s.department}</td><td style={{color:s.gpa>=3.5?"var(--success)":"var(--warning)"}}>{s.gpa}</td>
            <td><span style={{color:"var(--primary-light)",fontWeight:600}}>{parseFloat(s.avg_overall_score||0).toFixed(1)}/5</span></td>
            <td><span className={`badge badge-${s.placement_status}`}>{s.placement_status?.replace("_"," ")}</span></td></tr>
          ))}</tbody></table>
        </div>
      </div>
    </div>
  );
}
