import { useState, useEffect } from "react";
import { internshipAPI } from "../../services/api";
import toast from "react-hot-toast";
import { Search, Briefcase, DollarSign, MapPin, Clock, Tag, Building2 } from "lucide-react";
import { Link } from "react-router-dom";

export default function FacultyBrowseInternships() {
  const [internships, setInternships] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [domain, setDomain]           = useState("");
  const [minStipend, setMinStipend]   = useState("");

  const load = () => {
    setLoading(true);
    internshipAPI.getAll({ search, domain, min_stipend: minStipend })
      .then(r => setInternships(r.data.data || []))
      .catch(() => toast.error("Failed to load internships"))
      .finally(() => setLoading(false));
  };
  useEffect(load, [search, domain, minStipend]);

  const domains = [...new Set(internships.map(i => i.domain))].filter(Boolean);

  return (
    <div>
      <div className="section-header">
        <h1 className="section-title">Browse All Internships</h1>
        <span style={{ color: "var(--text-muted)", fontSize: 13 }}>
          {internships.length} active internship{internships.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Search & Filters */}
      <div className="search-bar">
        <div className="search-input" style={{ flex: 2 }}>
          <Search className="search-icon" size={16} />
          <input
            className="form-control"
            placeholder="Search by title or description…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 40 }}
          />
        </div>
        <select
          className="form-control"
          style={{ flex: 1, minWidth: 150 }}
          value={domain}
          onChange={e => setDomain(e.target.value)}
        >
          <option value="">All Domains</option>
          {domains.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <input
          className="form-control"
          style={{ flex: 1, minWidth: 140 }}
          type="number"
          placeholder="Min. Stipend ₹"
          value={minStipend}
          onChange={e => setMinStipend(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /></div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(340px,1fr))", gap: 20 }}>
          {internships.length === 0 ? (
            <div className="empty-state" style={{ gridColumn: "1/-1" }}>
              <Briefcase size={40} />
              <h3>No internships available</h3>
              <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 8 }}>
                No approved internships found for the selected filters.
              </p>
            </div>
          ) : internships.map(i => (
            <div key={i.id} className="card" style={{ display: "flex", flexDirection: "column" }}>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{i.title}</h3>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 4 }}>
                    <Building2 size={12} /> {i.company_name}
                  </div>
                </div>
                <span className="badge badge-shortlisted">{i.domain}</span>
              </div>

              {/* Description */}
              <p style={{
                fontSize: 13, color: "var(--text-muted)", marginBottom: 12, flex: 1,
                overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical"
              }}>
                {i.description}
              </p>

              {/* Key info row */}
              <div style={{ display: "flex", gap: 16, marginBottom: 12, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, color: "var(--success)", display: "flex", alignItems: "center", gap: 4 }}>
                  <DollarSign size={12} /> ₹{parseInt(i.stipend).toLocaleString()}/month
                </span>
                <span style={{ fontSize: 12, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 4 }}>
                  <MapPin size={12} /> {i.location}
                </span>
                <span style={{ fontSize: 12, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 4 }}>
                  <Clock size={12} /> {i.duration_weeks} weeks
                </span>
              </div>

              {/* Required skills */}
              {i.requirements && (
                <div style={{
                  fontSize: 11, color: "var(--text-muted)", marginBottom: 10,
                  padding: "6px 8px", background: "rgba(79,70,229,0.08)", borderRadius: 6,
                  display: "flex", alignItems: "flex-start", gap: 6
                }}>
                  <Tag size={11} style={{ marginTop: 1, flexShrink: 0 }} />
                  <span><strong>Required Skills:</strong> {i.requirements}</span>
                </div>
              )}

              {/* Footer meta */}
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 12 }}>
                Deadline: {new Date(i.application_deadline).toLocaleDateString()} &nbsp;·&nbsp;
                {i.application_count} applied &nbsp;·&nbsp;
                {i.vacancies} {i.vacancies === 1 ? "vacancy" : "vacancies"}
              </div>

              {/* Action */}
              <Link
                to={`/internships/${i.id}`}
                className="btn btn-secondary btn-sm"
                style={{ justifyContent: "center" }}
              >
                View Full Details
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
