import { useState, useEffect } from "react";
import { evaluationAPI, applicationAPI } from "../../services/api";
import toast from "react-hot-toast";
import { Plus, Award } from "lucide-react";

const emptyForm = { application_id:"",evaluator_type:"faculty",technical_skills:3,soft_skills:3,punctuality:3,responsibility:3,teamwork:3,learning_ability:3,comments:"",strengths:"",improvement_areas:"",recommend_fulltime:null };

const StarRating = ({ value, onChange }) => (
  <div style={{display:"flex",gap:6}}>
    {[1,2,3,4,5].map(s=>(
      <button key={s} type="button" onClick={()=>onChange(s)}
        style={{width:32,height:32,borderRadius:"50%",border:"none",cursor:"pointer",fontSize:14,fontWeight:700,
          background:s<=value?"linear-gradient(135deg,#4f46e5,#06b6d4)":"var(--dark-border)",
          color:s<=value?"white":"var(--text-muted)",transition:"all 0.2s"}}>
        {s}
      </button>
    ))}
    <span style={{fontSize:12,color:"var(--text-secondary)",alignSelf:"center",marginLeft:4}}>{value}/5</span>
  </div>
);

export default function CreateEvaluation() {
  const [evals, setEvals] = useState([]);
  const [apps, setApps] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const fetch = () => Promise.all([evaluationAPI.getAll({}), applicationAPI.getAll({status:"accepted"})])
    .then(([er,ar])=>{ setEvals(er.data.data||[]); setApps(ar.data.data||[]); });
  useEffect(()=>{fetch();},[]);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try { await evaluationAPI.create(form); toast.success("Evaluation submitted!"); setShowModal(false); fetch(); }
    catch(err) { toast.error(err.response?.data?.message||"Failed"); }
    finally { setSaving(false); }
  };

  const criteria = [
    { key:"technical_skills",  label:"Technical Skills" },
    { key:"soft_skills",       label:"Soft Skills" },
    { key:"punctuality",       label:"Punctuality" },
    { key:"responsibility",    label:"Responsibility" },
    { key:"teamwork",          label:"Teamwork" },
    { key:"learning_ability",  label:"Learning Ability" },
  ];

  return (
    <div>
      <div className="section-header"><h1 className="section-title">Evaluations</h1>
        <button className="btn btn-primary" onClick={()=>{setForm(emptyForm);setShowModal(true);}}><Plus size={16}/> New Evaluation</button>
      </div>
      <div className="table-container"><table>
        <thead><tr><th>Student</th><th>Internship</th><th>Type</th><th>Overall Score</th><th>Recommend</th><th>Date</th></tr></thead>
        <tbody>{evals.length===0 ? <tr><td colSpan={6}><div className="empty-state"><Award size={32}/><h3>No evaluations yet</h3></div></td></tr>
        : evals.map(e=>(
          <tr key={e.id}>
            <td style={{fontWeight:500}}>{e.student_name}</td>
            <td style={{fontSize:13,color:"var(--text-secondary)"}}>{e.internship_title}</td>
            <td><span className={`badge ${e.evaluator_type==="faculty"?"badge-faculty":"badge-shortlisted"}`}>{e.evaluator_type}</span></td>
            <td>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontWeight:700,color:"var(--primary-light)",fontSize:16}}>{parseFloat(e.overall_score||0).toFixed(1)}</span>
                <div className="score-bar" style={{width:80}}><div className="score-fill" style={{width:`${(e.overall_score/5)*100}%`}}/></div>
              </div>
            </td>
            <td>{e.recommend_fulltime===null?"—":e.recommend_fulltime?<span style={{color:"var(--success)"}}>✓ Yes</span>:<span style={{color:"var(--danger)"}}>✗ No</span>}</td>
            <td style={{fontSize:12,color:"var(--text-muted)"}}>{new Date(e.created_at).toLocaleDateString()}</td>
          </tr>
        ))}</tbody>
      </table></div>

      {showModal && (
        <div className="modal-overlay" onClick={()=>setShowModal(false)}>
          <div className="modal" style={{maxWidth:640}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><span className="modal-title">New Evaluation</span><button className="btn btn-sm btn-secondary" onClick={()=>setShowModal(false)}>✕</button></div>
            <form onSubmit={save}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Application (Accepted)*</label>
                    <select className="form-control" value={form.application_id} onChange={e=>setForm({...form,application_id:e.target.value})} required>
                      <option value="">Select application</option>
                      {apps.map(a=><option key={a.id} value={a.id}>{a.student_name} — {a.internship_title}</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label className="form-label">Evaluator Type</label>
                    <select className="form-control" value={form.evaluator_type} onChange={e=>setForm({...form,evaluator_type:e.target.value})}>
                      <option value="faculty">Faculty</option><option value="company">Company</option>
                    </select>
                  </div>
                </div>
                <div style={{background:"var(--dark)",borderRadius:"var(--radius-sm)",padding:16,marginBottom:16}}>
                  <h4 style={{fontSize:14,fontWeight:600,marginBottom:12,color:"var(--text-secondary)"}}>Performance Ratings (1-5)</h4>
                  {criteria.map(c=>(
                    <div key={c.key} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                      <span style={{fontSize:13,minWidth:140}}>{c.label}</span>
                      <StarRating value={form[c.key]} onChange={v=>setForm({...form,[c.key]:v})} />
                    </div>
                  ))}
                </div>
                <div className="form-group"><label className="form-label">Comments</label><textarea className="form-control" rows={2} value={form.comments} onChange={e=>setForm({...form,comments:e.target.value})} /></div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Strengths</label><textarea className="form-control" rows={2} value={form.strengths} onChange={e=>setForm({...form,strengths:e.target.value})} /></div>
                  <div className="form-group"><label className="form-label">Improvement Areas</label><textarea className="form-control" rows={2} value={form.improvement_areas} onChange={e=>setForm({...form,improvement_areas:e.target.value})} /></div>
                </div>
                <div className="form-group"><label className="form-label">Recommend for Full-Time?</label>
                  <div style={{display:"flex",gap:12}}>
                    {[{v:1,label:"Yes"},{v:0,label:"No"},{v:null,label:"Unsure"}].map(opt=>(
                      <label key={String(opt.v)} style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:14}}>
                        <input type="radio" checked={form.recommend_fulltime===opt.v} onChange={()=>setForm({...form,recommend_fulltime:opt.v})} />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={()=>setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving?"Saving...":"Submit Evaluation"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
