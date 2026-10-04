import { useState, useEffect } from "react";
import { feedbackAPI, applicationAPI } from "../../services/api";
import toast from "react-hot-toast";
import { Star } from "lucide-react";

const StarRating = ({ value, onChange, label }) => (
  <div className="form-group">
    <label className="form-label">{label}</label>
    <div style={{display:"flex",gap:8}}>
      {[1,2,3,4,5].map(s=>(
        <button key={s} type="button" onClick={()=>onChange(s)}
          style={{width:36,height:36,borderRadius:"50%",border:"none",cursor:"pointer",fontSize:16,
            background:s<=value?"#f59e0b":"var(--dark-border)",color:s<=value?"white":"var(--text-muted)",transition:"all 0.2s"}}>
          ⭐
        </button>
      ))}
    </div>
  </div>
);

const emptyForm = { application_id:"",company_culture:3,mentorship_quality:3,technical_learning:3,work_environment:3,overall_experience:3,comments:"",suggestions:"",is_anonymous:false };
const sysFb = { category:"general",title:"",description:"",priority:"medium" };

export default function SubmitFeedback() {
  const [tab, setTab] = useState("internship");
  const [apps, setApps] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [sysForm, setSysForm] = useState(sysFb);
  const [saving, setSaving] = useState(false);

  useEffect(()=>{ applicationAPI.getAll({status:"accepted"}).then(r=>setApps(r.data.data||[])).catch(()=>{}); },[]);

  const submitInternshipFeedback = async (e) => {
    e.preventDefault();
    if (!form.application_id) { toast.error("Select an application"); return; }
    setSaving(true);
    try { await feedbackAPI.submitStudentFeedback(form); toast.success("Feedback submitted!"); setForm(emptyForm); }
    catch(err) { toast.error(err.response?.data?.message||"Failed"); }
    finally { setSaving(false); }
  };

  const submitSysFeedback = async (e) => {
    e.preventDefault();
    setSaving(true);
    try { await feedbackAPI.submitSystemFeedback(sysForm); toast.success("System feedback submitted!"); setSysForm(sysFb); }
    catch(err) { toast.error(err.response?.data?.message||"Failed"); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div className="section-header"><h1 className="section-title">Submit Feedback</h1></div>
      <div className="tabs">
        <button className={`tab ${tab==="internship"?"active":""}`} onClick={()=>setTab("internship")}>Internship / Company Feedback</button>
        <button className={`tab ${tab==="system"?"active":""}`} onClick={()=>setTab("system")}>System Feedback</button>
      </div>
      {tab === "internship" && (
        <div className="card">
          <h2 style={{fontSize:15,fontWeight:600,marginBottom:16}}>Rate Your Internship Experience</h2>
          <form onSubmit={submitInternshipFeedback}>
            <div className="form-group"><label className="form-label">Select Internship (Accepted Applications)*</label>
              <select className="form-control" value={form.application_id} onChange={e=>setForm({...form,application_id:e.target.value})} required>
                <option value="">Select your internship...</option>
                {apps.map(a=><option key={a.id} value={a.id}>{a.internship_title} — {a.company_name}</option>)}
              </select>
            </div>
            <div style={{background:"var(--dark)",borderRadius:"var(--radius-sm)",padding:16,marginBottom:16}}>
              <h3 style={{fontSize:14,fontWeight:600,marginBottom:12,color:"var(--text-secondary)"}}>Rate each aspect (1-5 stars)</h3>
              <StarRating label="Company Culture" value={form.company_culture} onChange={v=>setForm({...form,company_culture:v})} />
              <StarRating label="Mentorship Quality" value={form.mentorship_quality} onChange={v=>setForm({...form,mentorship_quality:v})} />
              <StarRating label="Technical Learning" value={form.technical_learning} onChange={v=>setForm({...form,technical_learning:v})} />
              <StarRating label="Work Environment" value={form.work_environment} onChange={v=>setForm({...form,work_environment:v})} />
              <StarRating label="Overall Experience" value={form.overall_experience} onChange={v=>setForm({...form,overall_experience:v})} />
            </div>
            <div className="form-group"><label className="form-label">Comments</label>
              <textarea className="form-control" rows={3} value={form.comments} onChange={e=>setForm({...form,comments:e.target.value})} placeholder="Share your experience..." />
            </div>
            <div className="form-group"><label className="form-label">Suggestions for Improvement</label>
              <textarea className="form-control" rows={2} value={form.suggestions} onChange={e=>setForm({...form,suggestions:e.target.value})} />
            </div>
            <div className="form-group">
              <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:14}}>
                <input type="checkbox" checked={form.is_anonymous} onChange={e=>setForm({...form,is_anonymous:e.target.checked})} />
                Submit anonymously
              </label>
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving?"Submitting...":"Submit Feedback"}</button>
          </form>
        </div>
      )}
      {tab === "system" && (
        <div className="card">
          <h2 style={{fontSize:15,fontWeight:600,marginBottom:16}}>System Feedback (Features, Bugs, Suggestions)</h2>
          <form onSubmit={submitSysFeedback}>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Category</label>
                <select className="form-control" value={sysForm.category} onChange={e=>setSysForm({...sysForm,category:e.target.value})}>
                  <option value="feature_request">Feature Request</option>
                  <option value="bug_report">Bug Report</option>
                  <option value="improvement">Improvement</option>
                  <option value="general">General</option>
                </select>
              </div>
              <div className="form-group"><label className="form-label">Priority</label>
                <select className="form-control" value={sysForm.priority} onChange={e=>setSysForm({...sysForm,priority:e.target.value})}>
                  <option value="low">Low</option><option value="medium">Medium</option>
                  <option value="high">High</option><option value="critical">Critical</option>
                </select>
              </div>
            </div>
            <div className="form-group"><label className="form-label">Title*</label>
              <input className="form-control" value={sysForm.title} onChange={e=>setSysForm({...sysForm,title:e.target.value})} placeholder="Brief title..." required />
            </div>
            <div className="form-group"><label className="form-label">Description*</label>
              <textarea className="form-control" rows={4} value={sysForm.description} onChange={e=>setSysForm({...sysForm,description:e.target.value})} placeholder="Detailed description..." required />
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving?"Submitting...":"Submit System Feedback"}</button>
          </form>
        </div>
      )}
    </div>
  );
}
