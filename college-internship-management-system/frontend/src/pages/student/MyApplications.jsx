import { useState, useEffect } from "react";
import { applicationAPI } from "../../services/api";
import toast from "react-hot-toast";
import { ClipboardList, Clock, Building2, Calendar } from "lucide-react";

const STATUS_COLORS = {
  pending: "badge-pending",
  shortlisted: "badge-shortlisted",
  accepted: "badge-accepted",
  rejected: "badge-rejected",
  withdrawn: "badge-secondary",
};

export default function MyApplications() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const loadApps = () => {
    setLoading(true);
    applicationAPI.getAll({})
      .then(r => setApps(r.data.data || []))
      .catch(() => toast.error("Failed to load applications"))
      .finally(() => setLoading(false));
  };
  useEffect(loadApps, []);

  const withdraw = async (id) => {
    if (!window.confirm("Withdraw this application?")) return;
    try {
      await applicationAPI.withdraw(id);
      toast.success("Application withdrawn");
      loadApps();
    } catch(err) { toast.error(err.response?.data?.message || "Failed to withdraw"); }
  };

  const filtered = filter === "all" ? apps : apps.filter(a => a.status === filter);

  const counts = {
    all: apps.length,
    pending: apps.filter(a => a.status === "pending").length,
    shortlisted: apps.filter(a => a.status === "shortlisted").length,
    accepted: apps.filter(a => a.status === "accepted").length,
    rejected: apps.filter(a => a.status === "rejected").length,
    withdrawn: apps.filter(a => a.status === "withdrawn").length,
  };

  return (
    <div>
      <div className="section-header">
        <h1 className="section-title">My Applications</h1>
        <span style={{color:"var(--text-muted)",fontSize:13}}>{apps.length} total</span>
      </div>

      {/* Status filter tabs */}
      <div className="tabs">
        {[
          { key: "all", label: "All" },
          { key: "pending", label: "Pending" },
          { key: "shortlisted", label: "Shortlisted" },
          { key: "accepted", label: "Accepted" },
          { key: "rejected", label: "Rejected" },
          { key: "withdrawn", label: "Withdrawn" },
        ].map(s => (
          <button key={s.key} className={`tab ${filter === s.key ? "active" : ""}`} onClick={() => setFilter(s.key)}>
            {s.label}
            {counts[s.key] > 0 && (
              <span style={{marginLeft:6,background:"rgba(79,70,229,0.2)",color:"var(--primary-light)",padding:"1px 6px",borderRadius:10,fontSize:11}}>
                {counts[s.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? <div className="loading"><div className="spinner"/></div> : (
        <>
          {filtered.length === 0 ? (
            <div className="empty-state">
              <ClipboardList size={40}/>
              <h3>No applications {filter !== "all" ? `with status "${filter}"` : "yet"}</h3>
              {filter === "all" && <p style={{color:"var(--text-muted)",fontSize:13}}>Browse available internships and submit your application.</p>}
            </div>
          ) : (
            <div style={{display:"grid",gap:16}}>
              {filtered.map(a => (
                <div key={a.id} className="card" style={{padding:20}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
                    <div style={{flex:1,minWidth:200}}>
                      <div style={{fontWeight:700,fontSize:16,marginBottom:4}}>{a.internship_title}</div>
                      <div style={{display:"flex",alignItems:"center",gap:6,color:"var(--text-secondary)",fontSize:13,marginBottom:8}}>
                        <Building2 size={13}/> {a.company_name}
                      </div>
                      <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
                        {a.domain && (
                          <span className="badge badge-shortlisted" style={{fontSize:11}}>{a.domain}</span>
                        )}
                        {a.duration_weeks && (
                          <span style={{fontSize:12,color:"var(--text-muted)",display:"flex",alignItems:"center",gap:4}}>
                            <Clock size={11}/> {a.duration_weeks} weeks
                          </span>
                        )}
                        {a.stipend !== undefined && (
                          <span style={{fontSize:12,color:"var(--success)"}}>
                            ₹{parseInt(a.stipend || 0).toLocaleString()}/mo
                          </span>
                        )}
                        <span style={{fontSize:12,color:"var(--text-muted)",display:"flex",alignItems:"center",gap:4}}>
                          <Calendar size={11}/> Applied: {new Date(a.applied_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:8}}>
                      <span className={`badge ${STATUS_COLORS[a.status] || "badge-pending"}`} style={{fontSize:13,padding:"4px 14px",textTransform:"capitalize"}}>
                        {a.status}
                      </span>
                      {["pending","shortlisted"].includes(a.status) && (
                        <button className="btn btn-sm btn-danger" onClick={() => withdraw(a.id)}>Withdraw</button>
                      )}
                    </div>
                  </div>
                  {a.review_notes && (
                    <div style={{marginTop:12,padding:"10px 14px",background:"rgba(51,65,85,0.4)",borderRadius:8,fontSize:13,color:"var(--text-secondary)",borderLeft:"3px solid var(--primary)"}}>
                      <strong>Admin Note:</strong> {a.review_notes}
                    </div>
                  )}
                  {a.reviewed_at && (
                    <div style={{marginTop:6,fontSize:11,color:"var(--text-muted)"}}>
                      Reviewed: {new Date(a.reviewed_at).toLocaleString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
