import { useState, useEffect } from "react";
import { applicationAPI } from "../../services/api";
import toast from "react-hot-toast";
import { ClipboardList } from "lucide-react";

export default function ReviewApplications() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState("");
  const fetch = () => { setLoading(true); applicationAPI.getAll({}).then(r=>setApps(r.data.data||[])).catch(()=>toast.error("Failed")).finally(()=>setLoading(false)); };
  useEffect(fetch,[]);
  const filtered = filter === "all" ? apps : apps.filter(a=>a.status===filter);
  const updateStatus = async (id, status) => {
    try { await applicationAPI.updateStatus(id, { status, review_notes: notes }); toast.success(`Status updated to ${status}`); setSelected(null); fetch(); }
    catch(err) { toast.error(err.response?.data?.message||"Failed"); }
  };
  const statusColors = { pending:"#f59e0b",shortlisted:"#06b6d4",accepted:"#10b981",rejected:"#ef4444",withdrawn:"#94a3b8" };
  return (
    <div>
      <div className="section-header"><h1 className="section-title">Review Applications</h1></div>
      <div className="tabs">
        {["all","pending","shortlisted","accepted","rejected"].map(s=>(
          <button key={s} className={`tab ${filter===s?"active":""}`} onClick={()=>setFilter(s)}>{s.charAt(0).toUpperCase()+s.slice(1)} {s==="all"?`(${apps.length})`:""}</button>
        ))}
      </div>
      {loading ? <div className="loading"><div className="spinner"/></div> : (
        <div className="table-container"><table>
          <thead><tr><th>Student</th><th>Internship</th><th>Company</th><th>GPA</th><th>Applied</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>{filtered.length===0 ? <tr><td colSpan={7}><div className="empty-state"><ClipboardList size={32}/><h3>No applications</h3></div></td></tr>
          : filtered.map(a=>(
            <tr key={a.id}>
              <td><div style={{fontWeight:500}}>{a.student_name}</div><div style={{fontSize:11,color:"var(--text-muted)"}}>{a.enrollment_no}</div></td>
              <td style={{fontSize:13}}>{a.internship_title}</td>
              <td style={{fontSize:12,color:"var(--text-secondary)"}}>{a.company_name}</td>
              <td style={{color:a.gpa>=3.5?"var(--success)":"var(--warning)",fontWeight:600}}>{a.gpa}</td>
              <td style={{fontSize:12,color:"var(--text-muted)"}}>{new Date(a.applied_at).toLocaleDateString()}</td>
              <td><span className={`badge badge-${a.status}`}>{a.status}</span></td>
              <td>
                <div className="btn-group">
                  {a.status !== "shortlisted" && <button className="btn btn-sm btn-secondary" style={{color:"#06b6d4"}} onClick={()=>{setSelected({...a,newStatus:"shortlisted"});setNotes("");}}>Shortlist</button>}
                  {a.status !== "accepted"    && <button className="btn btn-sm btn-success"   onClick={()=>{setSelected({...a,newStatus:"accepted"});setNotes("");}}>Accept</button>}
                  {a.status !== "rejected"    && <button className="btn btn-sm btn-danger"    onClick={()=>{setSelected({...a,newStatus:"rejected"});setNotes("");}}>Reject</button>}
                </div>
              </td>
            </tr>
          ))}
          </tbody>
        </table></div>
      )}
      {selected && (
        <div className="modal-overlay" onClick={()=>setSelected(null)}>
          <div className="modal" style={{maxWidth:480}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><span className="modal-title">Update Application Status</span><button className="btn btn-sm btn-secondary" onClick={()=>setSelected(null)}>✕</button></div>
            <div className="modal-body">
              <p style={{marginBottom:12,fontSize:14}}>Set <strong>{selected.student_name}</strong>  application to <span style={{color:statusColors[selected.newStatus],fontWeight:700}}>{selected.newStatus}</span>?</p>
              <div className="form-group"><label className="form-label">Review Notes (optional)</label>
                <textarea className="form-control" rows={3} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Feedback for student..." /></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={()=>setSelected(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={()=>updateStatus(selected.id,selected.newStatus)}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
