import { useState, useEffect } from "react";
import { adminAPI } from "../../services/api";
import toast from "react-hot-toast";
import { Users, ToggleLeft, ToggleRight } from "lucide-react";

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const fetch = () => { setLoading(true); adminAPI.getUsers().then(r=>setUsers(r.data.data||[])).catch(()=>toast.error("Failed")).finally(()=>setLoading(false)); };
  useEffect(fetch, []);
  const toggleStatus = async (id, current) => {
    try { await adminAPI.toggleUserStatus(id, { is_active: current ? 0 : 1 }); toast.success("Status updated"); fetch(); }
    catch { toast.error("Failed"); }
  };
  return (
    <div>
      <div className="section-header"><h1 className="section-title">All Users</h1><span style={{color:"var(--text-muted)",fontSize:13}}>{users.length} total</span></div>
      {loading ? <div className="loading"><div className="spinner"/></div> : (
        <div className="table-container"><table>
          <thead><tr><th>User</th><th>Role</th><th>Status</th><th>Last Login</th><th>Joined</th><th>Toggle</th></tr></thead>
          <tbody>{users.map(u=>(
            <tr key={u.id}>
              <td><div style={{fontWeight:500}}>{u.full_name||"—"}</div><div style={{fontSize:11,color:"var(--text-muted)"}}>{u.email}</div></td>
              <td><span className={`badge badge-${u.role}`}>{u.role}</span></td>
              <td><span className={`badge ${u.is_active?"badge-accepted":"badge-rejected"}`}>{u.is_active?"Active":"Inactive"}</span></td>
              <td style={{fontSize:12,color:"var(--text-muted)"}}>{u.last_login ? new Date(u.last_login).toLocaleDateString() : "Never"}</td>
              <td style={{fontSize:12,color:"var(--text-muted)"}}>{new Date(u.created_at).toLocaleDateString()}</td>
              <td>
                <button className={`btn btn-sm ${u.is_active?"btn-danger":"btn-success"}`} onClick={()=>toggleStatus(u.id,u.is_active)}>
                  {u.is_active ? <><ToggleRight size={14}/> Deactivate</> : <><ToggleLeft size={14}/> Activate</>}
                </button>
              </td>
            </tr>
          ))}</tbody>
        </table></div>
      )}
    </div>
  );
}
