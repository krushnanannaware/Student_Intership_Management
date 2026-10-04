import { useState, useEffect } from "react";
import { studentAPI, adminAPI, authAPI } from "../../services/api";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

export default function StudentProfile() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [pwForm, setPwForm] = useState({ current_password:"",new_password:"",confirm_password:"" });
  const [pwErrors, setPwErrors] = useState({});

  useEffect(()=>{
    Promise.all([studentAPI.getMyProfile(), adminAPI.getDepartments()])
      .then(([pr,dr])=>{ setProfile(pr.data.data); setForm(pr.data.data); setDepartments(dr.data.data||[]); })
      .catch(()=>toast.error("Failed to load profile")).finally(()=>setLoading(false));
  },[]);

  const saveProfile = async (e) => {
    e.preventDefault();
    if (form.gpa && (parseFloat(form.gpa)<0||parseFloat(form.gpa)>4)) { toast.error("GPA must be 0.0-4.0"); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      Object.keys(form).forEach(k=>{ if(["full_name","phone","department_id","gpa","year_of_study"].includes(k)) fd.append(k,form[k]); });
      if (form.resume_file) fd.append("resume", form.resume_file);
      await studentAPI.update(profile.id, fd);
      toast.success("Profile updated!"); setEditing(false);
      studentAPI.getMyProfile().then(r=>setProfile(r.data.data));
    } catch(err) { toast.error(err.response?.data?.message||"Failed"); }
    finally { setSaving(false); }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!pwForm.current_password) errs.current = "Required";
    if (pwForm.new_password.length < 8) errs.new = "Min 8 chars";
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(pwForm.new_password)) errs.new = "Must contain uppercase, lowercase, number, special char";
    if (pwForm.new_password !== pwForm.confirm_password) errs.confirm = "Passwords do not match";
    setPwErrors(errs);
    if (Object.keys(errs).length) return;
    try { await authAPI.changePassword({ current_password: pwForm.current_password, new_password: pwForm.new_password }); toast.success("Password changed!"); setPwForm({current_password:"",new_password:"",confirm_password:""}); }
    catch(err) { toast.error(err.response?.data?.message||"Failed"); }
  };

  if (loading) return <div className="loading"><div className="spinner"/></div>;
  if (!profile) return <div className="alert alert-error">Profile not found</div>;

  return (
    <div style={{maxWidth:720}}>
      <div className="section-header"><h1 className="section-title">My Profile</h1>
        {!editing && <button className="btn btn-primary" onClick={()=>setEditing(true)}>Edit Profile</button>}
      </div>
      {/* Profile display/edit */}
      <div className="card" style={{marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:20,marginBottom:24}}>
          <div className="avatar" style={{width:72,height:72,fontSize:24}}>{profile.full_name?.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()}</div>
          <div>
            <h2 style={{fontSize:20,fontWeight:700}}>{profile.full_name}</h2>
            <div style={{color:"var(--text-secondary)",fontSize:14}}>{user.email}</div>
            <span className={`badge badge-${profile.placement_status}`} style={{marginTop:4}}>{profile.placement_status?.replace("_"," ")}</span>
          </div>
        </div>
        {!editing ? (
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            {[["Phone",profile.phone],["Department",profile.department_name],["GPA",profile.gpa],["Year",`Year ${profile.year_of_study}`],["Enrollment No",profile.enrollment_no]].map(([k,v])=>(
              <div key={k}><div style={{fontSize:11,color:"var(--text-muted)",marginBottom:2}}>{k}</div><div style={{fontWeight:500}}>{v||"—"}</div></div>
            ))}
          </div>
        ) : (
          <form onSubmit={saveProfile}>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Full Name</label><input className="form-control" value={form.full_name||""} onChange={e=>setForm({...form,full_name:e.target.value})} /></div>
              <div className="form-group"><label className="form-label">Phone</label><input className="form-control" value={form.phone||""} onChange={e=>setForm({...form,phone:e.target.value})} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Department</label>
                <select className="form-control" value={form.department_id||""} onChange={e=>setForm({...form,department_id:e.target.value})}>
                  {departments.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="form-group"><label className="form-label">GPA (0.0-4.0)</label><input className="form-control" type="number" step="0.01" min="0" max="4" value={form.gpa||""} onChange={e=>setForm({...form,gpa:e.target.value})} /></div>
            </div>
            <div className="form-group"><label className="form-label">Upload New Resume (PDF, max 5MB)</label><input className="form-control" type="file" accept=".pdf" onChange={e=>setForm({...form,resume_file:e.target.files[0]})} /></div>
            <div className="btn-group">
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving?"Saving...":"Save Changes"}</button>
              <button type="button" className="btn btn-secondary" onClick={()=>setEditing(false)}>Cancel</button>
            </div>
          </form>
        )}
      </div>
      {/* Change Password */}
      <div className="card">
        <h2 style={{fontSize:15,fontWeight:600,marginBottom:16}}>Change Password</h2>
        <form onSubmit={changePassword} style={{maxWidth:400}}>
          <div className="form-group"><label className="form-label">Current Password</label><input className="form-control" type="password" value={pwForm.current_password} onChange={e=>setPwForm({...pwForm,current_password:e.target.value})} />{pwErrors.current&&<span style={{fontSize:12,color:"var(--danger)"}}>{pwErrors.current}</span>}</div>
          <div className="form-group"><label className="form-label">New Password</label><input className="form-control" type="password" value={pwForm.new_password} onChange={e=>setPwForm({...pwForm,new_password:e.target.value})} />{pwErrors.new&&<span style={{fontSize:12,color:"var(--danger)"}}>{pwErrors.new}</span>}</div>
          <div className="form-group"><label className="form-label">Confirm New Password</label><input className="form-control" type="password" value={pwForm.confirm_password} onChange={e=>setPwForm({...pwForm,confirm_password:e.target.value})} />{pwErrors.confirm&&<span style={{fontSize:12,color:"var(--danger)"}}>{pwErrors.confirm}</span>}</div>
          <button type="submit" className="btn btn-primary">Change Password</button>
        </form>
      </div>
    </div>
  );
}
