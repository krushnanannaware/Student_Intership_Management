import { useState, useEffect } from "react";
import { interviewAPI, applicationAPI } from "../../services/api";
import toast from "react-hot-toast";
import { Plus, Calendar, XCircle } from "lucide-react";

const emptyForm = { application_id:"",interview_date:"",interview_time:"",interviewer:"",meeting_link:"",location:"",notes:"" };

export default function ScheduleInterviews() {
  const [interviews, setInterviews] = useState([]);
  const [apps, setApps] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const fetch = () => Promise.all([interviewAPI.getAll({}), applicationAPI.getAll({status:"shortlisted"})])
    .then(([ir,ar])=>{ setInterviews(ir.data.data||[]); setApps(ar.data.data||[]); });
  useEffect(()=>{fetch();},[]);

  const save = async (e) => {
    e.preventDefault();
    const scheduled = new Date(`${form.interview_date}T${form.interview_time}`);
    if (scheduled < new Date(Date.now() + 24*60*60*1000)) { toast.error("Interview must be at least 24 hours from now"); return; }
    setSaving(true);
    try { await interviewAPI.schedule(form); toast.success("Interview scheduled!"); setShowModal(false); fetch(); }
    catch(err) { toast.error(err.response?.data?.message||"Failed"); }
    finally { setSaving(false); }
  };

  const cancel = async (id) => {
    if (!window.confirm("Cancel this interview?")) return;
    try { await interviewAPI.cancel(id); toast.success("Interview cancelled"); fetch(); }
    catch { toast.error("Failed"); }
  };

  const upcoming = interviews.filter(i=>!i.is_cancelled && new Date(`${i.interview_date}T${i.interview_time}`) >= new Date());
  const past = interviews.filter(i=>i.is_cancelled || new Date(`${i.interview_date}T${i.interview_time}`) < new Date());

  return (
    <div>
      <div className="section-header"><h1 className="section-title">Schedule Interviews</h1>
        <button className="btn btn-primary" onClick={()=>{setForm(emptyForm);setShowModal(true);}}><Plus size={16}/> Schedule Interview</button>
      </div>
      <div className="tabs">
        <div className="tab active">Upcoming ({upcoming.length})</div>
      </div>
      <div className="table-container" style={{marginBottom:24}}><table>
        <thead><tr><th>Student</th><th>Internship</th><th>Date & Time</th><th>Interviewer</th><th>Result</th><th>Actions</th></tr></thead>
        <tbody>{upcoming.length===0 ? <tr><td colSpan={6}><div className="empty-state"><Calendar size={32}/><h3>No upcoming interviews</h3></div></td></tr>
        : upcoming.map(iv=>(
          <tr key={iv.id}>
            <td style={{fontWeight:500}}>{iv.student_name}</td>
            <td style={{fontSize:13,color:"var(--text-secondary)"}}>{iv.internship_title}</td>
            <td><div style={{fontSize:13}}>{new Date(iv.interview_date).toLocaleDateString()}</div><div style={{fontSize:11,color:"var(--text-muted)"}}>{iv.interview_time?.slice(0,5)}</div></td>
            <td style={{fontSize:13}}>{iv.interviewer}</td>
            <td><span className={`badge badge-${iv.result}`}>{iv.result}</span></td>
            <td>
              {iv.meeting_link && <a href={iv.meeting_link} target="_blank" rel="noreferrer" className="btn btn-sm btn-primary" style={{marginRight:8}}>Join</a>}
              <button className="btn btn-sm btn-danger" onClick={()=>cancel(iv.id)}><XCircle size={13}/></button>
            </td>
          </tr>
        ))}
        </tbody>
      </table></div>

      {showModal && (
        <div className="modal-overlay" onClick={()=>setShowModal(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><span className="modal-title">Schedule Interview</span><button className="btn btn-sm btn-secondary" onClick={()=>setShowModal(false)}>✕</button></div>
            <form onSubmit={save}>
              <div className="modal-body">
                <div className="form-group"><label className="form-label">Application (Shortlisted)*</label>
                  <select className="form-control" value={form.application_id} onChange={e=>setForm({...form,application_id:e.target.value})} required>
                    <option value="">Select shortlisted application</option>
                    {apps.map(a=><option key={a.id} value={a.id}>{a.student_name} — {a.internship_title}</option>)}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Date* (future)</label><input className="form-control" type="date" min={new Date(Date.now()+86400000).toISOString().split("T")[0]} value={form.interview_date} onChange={e=>setForm({...form,interview_date:e.target.value})} required /></div>
                  <div className="form-group"><label className="form-label">Time*</label><input className="form-control" type="time" value={form.interview_time} onChange={e=>setForm({...form,interview_time:e.target.value})} required /></div>
                </div>
                <div className="form-group"><label className="form-label">Interviewer Name*</label><input className="form-control" value={form.interviewer} onChange={e=>setForm({...form,interviewer:e.target.value})} required /></div>
                <div className="form-group"><label className="form-label">Meeting Link</label><input className="form-control" value={form.meeting_link} onChange={e=>setForm({...form,meeting_link:e.target.value})} placeholder="https://meet.google.com/..." /></div>
                <div className="form-group"><label className="form-label">Location (if in-person)</label><input className="form-control" value={form.location} onChange={e=>setForm({...form,location:e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Notes</label><textarea className="form-control" rows={2} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} /></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={()=>setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving?"Saving...":"Schedule"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
