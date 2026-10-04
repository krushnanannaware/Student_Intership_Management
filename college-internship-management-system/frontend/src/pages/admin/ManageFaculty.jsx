import { useState, useEffect } from "react";
import { adminAPI } from "../../services/api";
import { UserCheck } from "lucide-react";

export default function ManageFaculty() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { adminAPI.getUsers().then(r => setUsers((r.data.data||[]).filter(u=>u.role==="faculty"))).finally(()=>setLoading(false)); }, []);
  return (
    <div>
      <div className="section-header"><h1 className="section-title">Manage Faculty</h1></div>
      {loading ? <div className="loading"><div className="spinner"/></div> : (
        <div className="table-container"><table>
          <thead><tr><th>Name</th><th>Email</th><th>Status</th><th>Last Login</th></tr></thead>
          <tbody>{users.length === 0 ? <tr><td colSpan={4}><div className="empty-state"><UserCheck size={32}/><h3>No faculty found</h3></div></td></tr>
          : users.map(u=>(
            <tr key={u.id}>
              <td style={{fontWeight:500}}>{u.full_name || "—"}</td>
              <td style={{color:"var(--text-secondary)"}}>{u.email}</td>
              <td><span className={`badge ${u.is_active?"badge-accepted":"badge-rejected"}`}>{u.is_active?"Active":"Inactive"}</span></td>
              <td style={{fontSize:12,color:"var(--text-muted)"}}>{u.last_login ? new Date(u.last_login).toLocaleDateString() : "Never"}</td>
            </tr>
          ))}</tbody>
        </table></div>
      )}
    </div>
  );
}
