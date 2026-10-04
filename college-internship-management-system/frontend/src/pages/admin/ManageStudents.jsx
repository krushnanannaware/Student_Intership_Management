import { useState, useEffect } from "react";
import { studentAPI, adminAPI } from "../../services/api";
import toast from "react-hot-toast";
import { Search, UserX, GraduationCap } from "lucide-react";

export default function ManageStudents() {
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("");
  const [placement, setPlacement] = useState("");

  const fetchStudents = () => {
    setLoading(true);
    studentAPI.getAll({ search, department: dept, placement_status: placement })
      .then(r => setStudents(r.data.data || []))
      .catch(() => toast.error("Failed to load students"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { adminAPI.getDepartments().then(r => setDepartments(r.data.data || [])); }, []);
  useEffect(() => { fetchStudents(); }, [search, dept, placement]);

  const deactivate = async (id, name) => {
    if (!window.confirm(`Deactivate student ${name}? This is a soft delete.`)) return;
    try {
      await studentAPI.deactivate(id);
      toast.success("Student deactivated");
      fetchStudents();
    } catch { toast.error("Failed to deactivate"); }
  };

  return (
    <div>
      <div className="section-header">
        <h1 className="section-title">Manage Students</h1>
        <span style={{color:"var(--text-muted)",fontSize:13}}>{students.length} students</span>
      </div>

      <div className="search-bar">
        <div className="search-input" style={{flex:2}}>
          <Search className="search-icon" size={16} />
          <input className="form-control" placeholder="Search by name, enrollment no, email..." value={search} onChange={e => setSearch(e.target.value)} style={{paddingLeft:40}} />
        </div>
        <select className="form-control" style={{flex:1,minWidth:150}} value={dept} onChange={e => setDept(e.target.value)}>
          <option value="">All Departments</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select className="form-control" style={{flex:1,minWidth:140}} value={placement} onChange={e => setPlacement(e.target.value)}>
          <option value="">All Placement Status</option>
          <option value="placed">Placed</option>
          <option value="unplaced">Unplaced</option>
          <option value="opted_out">Opted Out</option>
        </select>
      </div>

      {loading ? <div className="loading"><div className="spinner"/></div> : (
        <div className="table-container">
          <table>
            <thead><tr>
              <th>Student</th><th>Department</th><th>GPA</th><th>Year</th><th>Enrollment No</th><th>Placement</th><th>Actions</th>
            </tr></thead>
            <tbody>
              {students.length === 0 ? (
                <tr><td colSpan={7}><div className="empty-state"><GraduationCap size={32}/><h3>No students found</h3></div></td></tr>
              ) : students.map(s => (
                <tr key={s.id}>
                  <td>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div className="avatar" style={{width:32,height:32,fontSize:12}}>{s.full_name?.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()}</div>
                      <div>
                        <div style={{fontWeight:500}}>{s.full_name}</div>
                        <div style={{fontSize:11,color:"var(--text-muted)"}}>{s.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{fontSize:13,color:"var(--text-secondary)"}}>{s.department_name}</td>
                  <td><span style={{fontWeight:600,color:s.gpa >= 3.5 ? "var(--success)": s.gpa >= 3.0 ? "var(--warning)" : "var(--danger)"}}>{s.gpa}</span></td>
                  <td style={{color:"var(--text-secondary)"}}>Year {s.year_of_study}</td>
                  <td style={{fontFamily:"monospace",fontSize:12}}>{s.enrollment_no}</td>
                  <td><span className={`badge badge-${s.placement_status}`}>{s.placement_status?.replace("_"," ")}</span></td>
                  <td>
                    <button className="btn btn-sm btn-danger" onClick={() => deactivate(s.id, s.full_name)}>
                      <UserX size={14}/> Deactivate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
