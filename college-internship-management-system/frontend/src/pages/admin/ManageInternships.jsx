import { useState, useEffect } from "react";
import { internshipAPI, companyAPI } from "../../services/api";
import toast from "react-hot-toast";
import { Plus, Edit, Archive, CheckCircle } from "lucide-react";

const emptyForm = {
  company_id:"", title:"", description:"", domain:"", location:"",
  duration_weeks:"", stipend:"", vacancies:1,
  start_date:"", end_date:"", application_deadline:"", requirements:""
};

export default function ManageInternships() {
  const [internships, setInternships] = useState([]);
  const [companies,   setCompanies]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showModal,   setShowModal]   = useState(false);
  const [editing,     setEditing]     = useState(null);
  const [form,        setForm]        = useState(emptyForm);
  const [saving,      setSaving]      = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([internshipAPI.getAll({}), companyAPI.getAll({})])
      .then(([ir, cr]) => {
        setInternships(ir.data.data || []);
        setCompanies(cr.data.data || []);
      })
      .catch(() => toast.error("Failed to load"))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
  const openEdit   = (i) => {
    setEditing(i);
    setForm({
      company_id: i.company_id, title: i.title, description: i.description,
      domain: i.domain, location: i.location,
      duration_weeks: i.duration_weeks, stipend: i.stipend,
      vacancies: i.vacancies,
      start_date: i.start_date?.split("T")[0],
      end_date: i.end_date?.split("T")[0],
      application_deadline: i.application_deadline?.split("T")[0],
      requirements: i.requirements || ""
    });
    setShowModal(true);
  };

  const validate = () => {
    if (!form.company_id)               { toast.error("Company is required.", { id: "intern-err" }); return false; }
    if (!form.title?.trim())            { toast.error("Title is required.", { id: "intern-err" }); return false; }
    const dw = parseInt(form.duration_weeks);
    if (!dw || dw < 4 || dw > 26)      { toast.error("Duration must be between 4 and 26 weeks.", { id: "intern-err" }); return false; }
    if (form.stipend === "" || form.stipend === undefined) { toast.error("Stipend is required.", { id: "intern-err" }); return false; }
    if (!form.requirements?.trim())     { toast.error("Required Skills are mandatory.", { id: "intern-err" }); return false; }
    if (!form.domain?.trim())           { toast.error("Domain is required.", { id: "intern-err" }); return false; }
    if (!form.description?.trim())      { toast.error("Description is required.", { id: "intern-err" }); return false; }
    if (!form.location?.trim())         { toast.error("Location is required.", { id: "intern-err" }); return false; }
    if (!form.start_date || !form.end_date || !form.application_deadline) { toast.error("All dates are required.", { id: "intern-err" }); return false; }
    if (new Date(form.end_date) <= new Date(form.start_date))             { toast.error("End date must be after start date.", { id: "intern-err" }); return false; }
    if (new Date(form.application_deadline) >= new Date(form.start_date)) { toast.error("Deadline must be before start date.", { id: "intern-err" }); return false; }
    return true;
  };

  const save = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      if (editing) {
        await internshipAPI.update(editing.id, form);
        toast.success("Internship updated");
      } else {
        const res = await internshipAPI.create(form);
        await internshipAPI.approve(res.data.data.id, "approve");
        toast.success("Internship posted & approved!");
      }
      setShowModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save", { id: "intern-err" });
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (id) => {
    try { await internshipAPI.approve(id, "approve"); toast.success("Internship approved!"); load(); }
    catch { toast.error("Failed to approve"); }
  };

  const handleArchive = async (id) => {
    if (!window.confirm("Archive this internship?")) return;
    try { await internshipAPI.archive(id); toast.success("Archived"); load(); }
    catch { toast.error("Failed"); }
  };

  const statusBadge = (s) => {
    const map = { approved:"badge-approved", pending:"badge-pending-status", archived:"badge-rejected" };
    return <span className={`badge ${map[s] || "badge-shortlisted"}`}>{s}</span>;
  };

  return (
    <div>
      <div className="section-header">
        <h1 className="section-title">Manage Internships</h1>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={16}/> Post Internship</button>
      </div>

      {loading ? <div className="loading"><div className="spinner"/></div> : (
        <div className="table-container"><table>
          <thead><tr>
            <th>Title</th><th>Company</th><th>Domain</th>
            <th>Duration</th><th>Stipend</th><th>Skills Required</th>
            <th>Deadline</th><th>Status</th><th>Actions</th>
          </tr></thead>
          <tbody>
            {internships.length === 0
              ? <tr><td colSpan={9}><div className="empty-state"><h3>No internships yet</h3></div></td></tr>
              : internships.map(i => (
                <tr key={i.id}>
                  <td style={{fontWeight:500}}>{i.title}</td>
                  <td style={{fontSize:13,color:"var(--text-secondary)"}}>{i.company_name}</td>
                  <td><span className="badge badge-shortlisted">{i.domain}</span></td>
                  <td style={{fontSize:13}}>{i.duration_weeks}w</td>
                  <td style={{color:"var(--success)"}}>₹{parseInt(i.stipend).toLocaleString()}</td>
                  <td style={{fontSize:11,maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={i.requirements}>{i.requirements || "—"}</td>
                  <td style={{fontSize:12,color:"var(--text-muted)"}}>{new Date(i.application_deadline).toLocaleDateString()}</td>
                  <td>{statusBadge(i.status)}</td>
                  <td>
                    <div className="btn-group">
                      {i.status === "pending" && (
                        <button className="btn btn-sm btn-success" title="Approve" onClick={() => handleApprove(i.id)}><CheckCircle size={13}/></button>
                      )}
                      <button className="btn btn-sm btn-secondary" title="Edit" onClick={() => openEdit(i)}><Edit size={13}/></button>
                      {i.status !== "archived" && (
                        <button className="btn btn-sm btn-warning" title="Archive" onClick={() => handleArchive(i.id)}><Archive size={13}/></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table></div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{maxWidth:720}} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{editing ? "Edit Internship" : "Post New Internship"}</span>
              <button className="btn btn-sm btn-secondary" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={save}>
              <div className="modal-body">

                <div className="form-group">
                  <label className="form-label">Company <span style={{color:"var(--danger)"}}>*</span></label>
                  <select className="form-control" value={form.company_id} onChange={e => setForm({...form, company_id:e.target.value})} required>
                    <option value="">Select Company</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Title <span style={{color:"var(--danger)"}}>*</span></label>
                    <input className="form-control" value={form.title} onChange={e => setForm({...form, title:e.target.value})} placeholder="e.g. Full Stack Developer Intern" required/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Domain <span style={{color:"var(--danger)"}}>*</span></label>
                    <input className="form-control" value={form.domain} onChange={e => setForm({...form, domain:e.target.value})} placeholder="Web Dev, AI/ML, Data Science..." required/>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description <span style={{color:"var(--danger)"}}>*</span></label>
                  <textarea className="form-control" rows={3} value={form.description} onChange={e => setForm({...form, description:e.target.value})} required/>
                </div>

                <div className="form-group">
                  <label className="form-label">Required Skills <span style={{color:"var(--danger)"}}>*</span></label>
                  <input className="form-control" value={form.requirements} onChange={e => setForm({...form, requirements:e.target.value})} placeholder="e.g. React, Node.js, MySQL, REST APIs" required/>
                  <span style={{fontSize:11,color:"var(--text-muted)"}}>Separate skills with commas</span>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Location <span style={{color:"var(--danger)"}}>*</span></label>
                    <input className="form-control" value={form.location} onChange={e => setForm({...form, location:e.target.value})} required/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Duration (weeks, 4–26) <span style={{color:"var(--danger)"}}>*</span></label>
                    <input className="form-control" type="number" min={4} max={26} value={form.duration_weeks} onChange={e => setForm({...form, duration_weeks:e.target.value})} required/>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Stipend (₹/month) <span style={{color:"var(--danger)"}}>*</span></label>
                    <input className="form-control" type="number" min={0} value={form.stipend} onChange={e => setForm({...form, stipend:e.target.value})} placeholder="e.g. 10000" required/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Vacancies</label>
                    <input className="form-control" type="number" min={1} value={form.vacancies} onChange={e => setForm({...form, vacancies:e.target.value})}/>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Start Date <span style={{color:"var(--danger)"}}>*</span></label>
                    <input className="form-control" type="date" value={form.start_date} onChange={e => setForm({...form, start_date:e.target.value})} required/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Date <span style={{color:"var(--danger)"}}>*</span></label>
                    <input className="form-control" type="date" value={form.end_date} onChange={e => setForm({...form, end_date:e.target.value})} required/>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Application Deadline <span style={{color:"var(--danger)"}}>*</span> <span style={{fontSize:11,color:"var(--text-muted)"}}>(must be before start date)</span></label>
                  <input className="form-control" type="date" value={form.application_deadline} onChange={e => setForm({...form, application_deadline:e.target.value})} required/>
                </div>

                {!editing && (
                  <div style={{padding:"10px 12px",background:"rgba(16,185,129,0.1)",border:"1px solid rgba(16,185,129,0.3)",borderRadius:8,fontSize:12,color:"var(--success)"}}>
                    ✅ As admin, this internship will be <strong>auto-approved</strong> and immediately visible to students.
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "Saving..." : editing ? "Update Internship" : "Post & Approve"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
