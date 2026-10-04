import { useState, useEffect } from "react";
import { feedbackAPI } from "../../services/api";
import toast from "react-hot-toast";

export default function SystemFeedbackAdmin() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const fetch = () => { feedbackAPI.getSystemFeedback().then(r=>setItems(r.data.data||[])).catch(()=>toast.error("Failed")).finally(()=>setLoading(false)); };
  useEffect(fetch,[]);
  const updateStatus = async (id, status, admin_notes) => {
    try { await feedbackAPI.updateSystemFeedback(id, {status, admin_notes}); toast.success("Updated"); fetch(); }
    catch { toast.error("Failed"); }
  };
  const catColor = { feature_request:"#4f46e5",bug_report:"#ef4444",general:"#06b6d4",improvement:"#10b981" };
  return (
    <div>
      <div className="section-header"><h1 className="section-title">System Feedback</h1></div>
      {loading ? <div className="loading"><div className="spinner"/></div> : (
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          {items.length === 0 ? <div className="empty-state"><h3>No feedback yet</h3></div> :
          items.map(item=>(
            <div className="card" key={item.id}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                <div>
                  <span className="badge" style={{background:`${catColor[item.category]}22`,color:catColor[item.category],marginRight:8}}>{item.category?.replace("_"," ")}</span>
                  <span style={{fontWeight:600,fontSize:15}}>{item.title}</span>
                </div>
                <span className={`badge ${item.status==="resolved"?"badge-accepted":item.status==="open"?"badge-pending":"badge-shortlisted"}`}>{item.status?.replace("_"," ")}</span>
              </div>
              <p style={{fontSize:13,color:"var(--text-secondary)",marginBottom:12}}>{item.description}</p>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <span style={{fontSize:11,color:"var(--text-muted)"}}>By: {item.user_email} ({item.user_role})</span>
                <span style={{fontSize:11,color:"var(--text-muted)"}}>{new Date(item.created_at).toLocaleDateString()}</span>
                <div style={{marginLeft:"auto",display:"flex",gap:8}}>
                  {item.status !== "resolved" && <button className="btn btn-sm btn-success" onClick={()=>updateStatus(item.id,"resolved","Addressed by admin")}>Resolve</button>}
                  {item.status !== "closed" && <button className="btn btn-sm btn-secondary" onClick={()=>updateStatus(item.id,"closed","Closed")}>Close</button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
