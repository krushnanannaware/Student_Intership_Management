import { useState, useEffect } from "react";
import { adminAPI } from "../../services/api";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Users, Building2, Briefcase, ClipboardList, TrendingUp, DollarSign, CheckCircle, XCircle, Clock, Star } from "lucide-react";

const COLORS = ["#4f46e5","#06b6d4","#10b981","#f59e0b","#ef4444","#8b5cf6"];

const StatCard = ({icon: Icon, label, value, color, sub}) => (
  <div className="stat-card">
    <div className="stat-icon" style={{background:`${color}22`}}>
      <Icon size={22} style={{color}} />
    </div>
    <div className="stat-value">{value ?? "—"}</div>
    <div className="stat-label">{label}</div>
    {sub && <div style={{fontSize:11,color:"var(--text-muted)",marginTop:4}}>{sub}</div>}
  </div>
);

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getDashboard().then(r => setData(r.data.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner"/><span>Loading dashboard...</span></div>;
  if (!data) return <div className="alert alert-error">Failed to load dashboard</div>;

  const { stats, appByStatus, appByDomain, placementByDept, recentActivity, topCompanies } = data;

  return (
    <div>
      <div className="section-header" style={{marginBottom:24}}>
        <div>
          <h1 className="section-title">Admin Dashboard</h1>
          <p style={{color:"var(--text-muted)",fontSize:13}}>System overview and key metrics</p>
        </div>
        <span className="badge badge-admin" style={{fontSize:12,padding:"6px 14px"}}>Administrator</span>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard icon={Users}        label="Total Students"       value={stats.total_students}     color="#4f46e5" />
        <StatCard icon={Users}        label="Total Faculty"        value={stats.total_faculty}      color="#8b5cf6" />
        <StatCard icon={Building2}    label="Companies"            value={stats.total_companies}    color="#06b6d4" />
        <StatCard icon={Briefcase}    label="Internships"          value={stats.total_internships}  color="#10b981" />
        <StatCard icon={ClipboardList} label="Total Applications"  value={stats.total_applications} color="#f59e0b" />
        <StatCard icon={CheckCircle}  label="Accepted"             value={stats.accepted_applications} color="#10b981" />
        <StatCard icon={XCircle}      label="Rejected"             value={stats.rejected_applications} color="#ef4444" />
        <StatCard icon={Clock}        label="Pending"              value={stats.pending_applications}  color="#f59e0b" />
        <StatCard icon={TrendingUp}   label="Placement Rate"       value={`${stats.placement_rate || 0}%`} color="#10b981" />
        <StatCard icon={DollarSign}   label="Avg Stipend"          value={`₹${Math.round(stats.avg_stipend||0).toLocaleString()}`} color="#06b6d4" />
      </div>

      {/* Charts Row */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:24}}>
        {/* Application Status Pie */}
        <div className="card">
          <div className="card-header"><span className="card-title">Application Status Distribution</span></div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={appByStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={90} label={({status,count}) => `${status}: ${count}`}>
                  {appByStatus.map((_,i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{background:"#1e293b",border:"1px solid #334155",borderRadius:8}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Applications by Domain */}
        <div className="card">
          <div className="card-header"><span className="card-title">Applications by Domain</span></div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={appByDomain} margin={{left:-20,bottom:20}}>
                <XAxis dataKey="domain" tick={{fill:"#94a3b8",fontSize:10}} angle={-30} textAnchor="end" />
                <YAxis tick={{fill:"#94a3b8",fontSize:11}} />
                <Tooltip contentStyle={{background:"#1e293b",border:"1px solid #334155",borderRadius:8}} />
                <Bar dataKey="count" fill="#4f46e5" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Placement by Department & Top Companies */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:24}}>
        <div className="card">
          <div className="card-header"><span className="card-title">Placement by Department</span></div>
          {placementByDept.map(d => (
            <div key={d.department} style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:4}}>
                <span>{d.department}</span>
                <span style={{color:"var(--success)"}}>{d.placed}/{d.total}</span>
              </div>
              <div className="score-bar">
                <div className="score-fill" style={{width:`${d.total > 0 ? (d.placed/d.total)*100 : 0}%`}} />
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Top Companies</span></div>
          <table><tbody>
            {topCompanies.map((c,i) => (
              <tr key={i}>
                <td><span style={{background:"rgba(79,70,229,0.2)",color:"var(--primary-light)",width:24,height:24,borderRadius:"50%",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700}}>{i+1}</span></td>
                <td style={{fontWeight:500}}>{c.name}</td>
                <td><span className="badge badge-pending">{c.applications} apps</span></td>
                <td><span className="badge badge-accepted">{c.hired} hired</span></td>
              </tr>
            ))}
          </tbody></table>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="card-header"><span className="card-title">Recent Activity</span></div>
        <div style={{maxHeight:250,overflowY:"auto"}}>
          {recentActivity.map((a,i) => (
            <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:"1px solid rgba(51,65,85,0.4)"}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:"var(--primary)",flexShrink:0}} />
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:500}}>{a.action.replace(/_/g," ")}</div>
                <div style={{fontSize:11,color:"var(--text-muted)"}}>{a.email} · {new Date(a.created_at).toLocaleString()}</div>
              </div>
              {a.entity_type && <span style={{fontSize:11,color:"var(--text-muted)",textTransform:"capitalize"}}>{a.entity_type}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
