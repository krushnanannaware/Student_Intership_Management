import { useState, useEffect } from "react";
import { evaluationAPI } from "../../services/api";
import { Award } from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from "recharts";

export default function MyEvaluations() {
  const [evals, setEvals] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(()=>{ evaluationAPI.getAll({}).then(r=>setEvals(r.data.data||[])).catch(console.error).finally(()=>setLoading(false)); },[]);
  if (loading) return <div className="loading"><div className="spinner"/></div>;
  return (
    <div>
      <div className="section-header"><h1 className="section-title">My Evaluations</h1></div>
      {evals.length===0 ? <div className="empty-state"><Award size={40}/><h3>No evaluations yet</h3><p>Evaluations appear after completing an internship</p></div>
      : evals.map(e=>{
        const chartData = [
          {subject:"Technical",value:e.technical_skills},{subject:"Soft Skills",value:e.soft_skills},
          {subject:"Punctuality",value:e.punctuality},{subject:"Responsibility",value:e.responsibility},
          {subject:"Teamwork",value:e.teamwork},{subject:"Learning",value:e.learning_ability}
        ];
        return (
          <div key={e.id} className="card" style={{marginBottom:20}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
              <div><div style={{fontWeight:700,fontSize:16}}>{e.internship_title}</div>
                <div style={{fontSize:13,color:"var(--text-secondary)"}}>{e.company_name} · {e.evaluator_type} evaluation</div></div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:28,fontWeight:800,color:"var(--primary-light)"}}>{parseFloat(e.overall_score||0).toFixed(1)}</div>
                <div style={{fontSize:11,color:"var(--text-muted)"}}>out of 5.0</div>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
              <div style={{height:200}}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={chartData}>
                    <PolarGrid stroke="#334155"/><PolarAngleAxis dataKey="subject" tick={{fill:"#94a3b8",fontSize:11}}/>
                    <Radar dataKey="value" fill="#4f46e5" fillOpacity={0.3} stroke="#4f46e5"/>
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div>
                {[["Technical Skills",e.technical_skills],["Soft Skills",e.soft_skills],["Punctuality",e.punctuality],["Responsibility",e.responsibility],["Teamwork",e.teamwork],["Learning Ability",e.learning_ability]].map(([label,val])=>(
                  <div key={label} style={{marginBottom:8}}>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:2}}><span>{label}</span><span style={{color:"var(--primary-light)",fontWeight:600}}>{val}/5</span></div>
                    <div className="score-bar"><div className="score-fill" style={{width:`${(val/5)*100}%`}}/></div>
                  </div>
                ))}
              </div>
            </div>
            {e.comments && <div style={{marginTop:12,padding:12,background:"var(--dark)",borderRadius:8,fontSize:13,color:"var(--text-secondary)"}}><strong>Comments:</strong> {e.comments}</div>}
            {e.strengths && <div style={{marginTop:8,fontSize:13,color:"var(--success)"}}>✓ Strengths: {e.strengths}</div>}
            {e.improvement_areas && <div style={{marginTop:4,fontSize:13,color:"var(--warning)"}}>→ Improvement: {e.improvement_areas}</div>}
          </div>
        );
      })}
    </div>
  );
}
