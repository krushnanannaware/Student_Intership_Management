import { useState, useEffect } from "react";
import { companyAPI } from "../../services/api";
import toast from "react-hot-toast";
import { Plus, Building2, Archive, Edit } from "lucide-react";

const emptyForm = { name:"",registration_number:"",industry:"",location:"",website:"",contact_person:"",contact_email:"",contact_phone:"",description:"" };

export default function ManageCompanies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const fetch = () => {
    setLoading(true);
    companyAPI.getAll({ search }).then(r => setCompanies(r.data.data || [])).catch(() => toast.error("Failed")).finally(() => setLoading(false));
  };
  useEffect(() => { fetch(); }, [search]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (c) => { setEditing(c); setForm({ name:c.name,registration_number:c.registration_number,industry:c.industry,location:c.location,website:c.website||"",contact_person:c.contact_person,contact_email:c.contact_email,contact_phone:c.contact_phone,description:c.description||"" }); setShowModal(true); };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) await companyAPI.update(editing.id, form);
      else await companyAPI.create(form);
      toast.success(editing ? "Company updated" : "Company created");
      setShowModal(false); fetch();
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
    finally { setSaving(false); }
  };

  const archive = async (id, name) => {
    if (!window.confirm(`Archive company "${name}"?`)) return;
    try { await companyAPI.archive(id); toast.success("Company archived"); fetch(); }
    catch { toast.error("Failed"); }
  };

  return (
    <div>
      <div className="section-header">
        <h1 className="section-title">Manage Companies</h1>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={16}/> Add Company</button>
      </div>

      <div className="search-bar">
        <input className="form-control" placeholder="Search companies..." value={search} onChange={e => setSearch(e.target.value)} style={{flex:1}} />
      </div>

      {loading ? <div className="loading"><div className="spinner"/></div> : (
        <div className="table-container">
          <table>
            <thead><tr><th>Company</th><th>Industry</th><th>Location</th><th>Contact</th><th>Reg. No</th><th>Actions</th></tr></thead>
            <tbody>
              {companies.length === 0 ? (
                <tr><td colSpan={6}><div className="empty-state"><Building2 size={32}/><h3>No companies</h3><p>Add your first company</p></div></td></tr>
              ) : companies.map(c => (
                <tr key={c.id}>
                  <td><div style={{fontWeight:500}}>{c.name}</div></td>
                  <td><span className="badge badge-shortlisted">{c.industry}</span></td>
                  <td style={{fontSize:13,color:"var(--text-secondary)"}}>{c.location}</td>
                  <td style={{fontSize:13}}>{c.contact_person}<div style={{fontSize:11,color:"var(--text-muted)"}}>{c.contact_email}</div></td>
                  <td style={{fontFamily:"monospace",fontSize:11}}>{c.registration_number}</td>
                  <td>
                    <div className="btn-group">
                      <button className="btn btn-sm btn-secondary" onClick={() => openEdit(c)}><Edit size={13}/></button>
                      <button className="btn btn-sm btn-warning" onClick={() => archive(c.id, c.name)}><Archive size={13}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{editing ? "Edit Company" : "Add Company"}</span>
              <button className="btn btn-sm btn-secondary" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={save}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Company Name*</label><input className="form-control" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required /></div>
                  <div className="form-group"><label className="form-label">Registration Number*</label><input className="form-control" value={form.registration_number} onChange={e=>setForm({...form,registration_number:e.target.value})} required disabled={!!editing} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Industry*</label><input className="form-control" value={form.industry} onChange={e=>setForm({...form,industry:e.target.value})} required /></div>
                  <div className="form-group"><label className="form-label">Location*</label><input className="form-control" value={form.location} onChange={e=>setForm({...form,location:e.target.value})} required /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Contact Person*</label><input className="form-control" value={form.contact_person} onChange={e=>setForm({...form,contact_person:e.target.value})} required /></div>
                  <div className="form-group"><label className="form-label">Contact Email*</label><input className="form-control" type="email" value={form.contact_email} onChange={e=>setForm({...form,contact_email:e.target.value})} required /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Contact Phone*</label><input className="form-control" value={form.contact_phone} onChange={e=>setForm({...form,contact_phone:e.target.value})} required /></div>
                  <div className="form-group"><label className="form-label">Website</label><input className="form-control" value={form.website} onChange={e=>setForm({...form,website:e.target.value})} /></div>
                </div>
                <div className="form-group"><label className="form-label">Description</label><textarea className="form-control" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} /></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={()=>setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving?"Saving...":"Save"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
