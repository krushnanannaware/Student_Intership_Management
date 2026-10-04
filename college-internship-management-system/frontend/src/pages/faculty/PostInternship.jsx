import { useState, useEffect } from "react";
import { internshipAPI, companyAPI } from "../../services/api";
import toast from "react-hot-toast";
import { Plus, Edit, Archive, CheckCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const emptyForm = { company_id:"",title:"",description:"",domain:"",location:"",duration_weeks:"",stipend:"",vacancies:1,start_date:"",end_date:"",application_deadline:"",requirements:"" };

export default function PostInternship() {
  const [internships, setInternships] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();

  const fetch = () => {
    setLoading(true);
    Promise.all([internshipAPI.getAll({ my_only: "true" }), companyAPI.getAll({})])
      .then(([ir, cr]) => { setInternships(ir.data.data || []); setCompanies(cr.data.data || []); })
      .catch(() => toast.error("Failed to load"))
      .finally(() => setLoading(false));
  };
  useEffect(fetch, []);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (i) => {
    setEditing(i);
    setForm({ company_id:i.company_id,title:i.title,description:i.description,domain:i.domain,location:i.location,
      duration_weeks:i.duration_weeks,stipend:i.stipend,vacancies:i.vacancies,
      start_date:i.start_date?.split("T")[0],end_date:i.end_date?.split("T")[0],
      application_deadline:i.application_deadline?.split("T")[0],requirements:i.requirements||"" });
    setShowModal(true);
  };

  const validate = () => {
    if (!form.company_id) { toast.error("Company name is required."); return false; }
    if (!form.title || !form.title.trim()) { toast.error("Internship title is required."); return false; }
    if (!form.duration_weeks) { toast.error("Internship duration is required."); return false; }
    const dw = parseInt(form.duration_weeks);
    if (!dw || dw < 4 || dw > 26) { toast.error("Duration must be between 4 and 26 weeks."); return false; }
    if (form.stipend === undefined || form.stipend === null || form.stipend === "") { toast.error("Stipend is required."); return false; }
    if (!form.domain || !form.domain.trim()) { toast.error("Domain is required."); return false; }
    if (!form.requirements || !form.requirements.trim()) { toast.error("Required skills are required."); return false; }
    if (!form.description || !form.description.trim()) { toast.error("Description is required."); return false; }
    if (!form.location || !form.location.trim()) { toast.error("Location is required."); return false; }
    if (!form.start_date || !form.end_date || !form.application_deadline) { toast.error("All dates are required."); return false; }
    if (new Date(form.end_date) <= new Date(form.start_date)) { toast.error("End date must be after start date."); return false; }
    if (new Date(form.application_deadline) >= new Date(form.start_date)) { toast.error("Deadline must be before start date."); return false; }
    return true;
  };

  const save = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      if (editing) await internshipAPI.update(editing.id, form);
      else await internshipAPI.create(form);
      toast.success(editing ? "Internship updated" : "Internship created (pending approval)");
      setShowModal(false); fetch();
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div className="section-header">
        <h1 className="section-title">Internship Postings</h1>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={16}/> Post Internship</button>
      </div>
      {loading ? <div className="loading"><div className="spinner"/></div> : (
        <div className="table-container"><table>
          <thead><tr><th>Title</th><th>Company</th><th>Domain</th><th>Duration</th><th>Stipend</th><th>Deadline</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>{internships.length===0 ? <tr><td colSpan={8}><div className="empty-state"><h3>No internships yet</h3></div></td></tr>
          : internships.map(i=>(
            <tr key={i.id}>
              <td style={{fontWeight:500}}>{i.title}</td>
              <td style={{fontSize:13,color:"var(--text-secondary)"}}>{i.company_name}</td>
              <td><span className="badge badge-shortlisted">{i.domain}</span></td>
              <td style={{fontSize:13}}>{i.duration_weeks}w</td>
              <td style={{color:"var(--success)"}}>₹{parseInt(i.stipend).toLocaleString()}</td>
              <td style={{fontSize:12,color:"var(--text-muted)"}}>{new Date(i.application_deadline).toLocaleDateString()}</td>
              <td><span className={`badge badge-${i.status === "pending" ? "pending-status" : i.status}`}>{i.status}</span></td>
              <td>
                <div className="btn-group">
                  {user?.role === "admin" && i.status === "pending" && (
                    <button className="btn btn-sm btn-success" onClick={async()=>{ await internshipAPI.approve(i.id,"approve"); toast.success("Approved!"); fetch(); }}><CheckCircle size={13}/></button>
                  )}
                  <button className="btn btn-sm btn-secondary" onClick={()=>openEdit(i)}><Edit size={13}/></button>
                  <button className="btn btn-sm btn-warning" onClick={async()=>{ await internshipAPI.archive(i.id); toast.success("Archived"); fetch(); }}><Archive size={13}/></button>
                </div>
              </td>
            </tr>
          ))}
          </tbody>
        </table></div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={()=>setShowModal(false)}>
          <div className="modal" style={{maxWidth:720}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{editing ? "Edit Internship" : "Post New Internship"}</span>
              <button className="btn btn-sm btn-secondary" onClick={()=>setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={save}>
              <div className="modal-body">
                <div className="form-group"><label className="form-label">Company*</label>
                  <select className="form-control" value={form.company_id} onChange={e=>setForm({...form,company_id:e.target.value})} required>
                    <option value="">Select Company</option>
                    {companies.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Title*</label><input className="form-control" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} required /></div>
                  <div className="form-group"><label className="form-label">Domain*</label><input className="form-control" value={form.domain} onChange={e=>setForm({...form,domain:e.target.value})} placeholder="Web Development, AI/ML..." required /></div>
                </div>
                <div className="form-group"><label className="form-label">Description*</label><textarea className="form-control" rows={3} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} required /></div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Location*</label><input className="form-control" value={form.location} onChange={e=>setForm({...form,location:e.target.value})} required /></div>
                  <div className="form-group"><label className="form-label">Duration (weeks, 4-26)*</label><input className="form-control" type="number" min={4} max={26} value={form.duration_weeks} onChange={e=>setForm({...form,duration_weeks:e.target.value})} required /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Stipend (₹/month) <span style={{color:"#ef4444"}}>*</span></label><input className="form-control" type="number" min={0} value={form.stipend} onChange={e=>setForm({...form,stipend:e.target.value})} placeholder="e.g. 5000" required /></div>
                  <div className="form-group"><label className="form-label">Vacancies</label><input className="form-control" type="number" min={1} value={form.vacancies} onChange={e=>setForm({...form,vacancies:e.target.value})} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Start Date*</label><input className="form-control" type="date" value={form.start_date} onChange={e=>setForm({...form,start_date:e.target.value})} required /></div>
                  <div className="form-group"><label className="form-label">End Date*</label><input className="form-control" type="date" value={form.end_date} onChange={e=>setForm({...form,end_date:e.target.value})} required /></div>
                </div>
                <div className="form-group"><label className="form-label">Application Deadline* (must be before start date)</label><input className="form-control" type="date" value={form.application_deadline} onChange={e=>setForm({...form,application_deadline:e.target.value})} required /></div>
                <div className="form-group"><label className="form-label">Required Skills <span style={{color:"#ef4444"}}>*</span></label><input className="form-control" value={form.requirements} onChange={e=>setForm({...form,requirements:e.target.value})} placeholder="e.g. Java, Spring Boot, SQL, HTML/CSS" required /></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={()=>setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving?"Saving...":"Save Internship"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
