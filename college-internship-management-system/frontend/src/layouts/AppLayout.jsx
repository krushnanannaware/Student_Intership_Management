import { Outlet, useLocation, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";
import { adminAPI } from "../services/api";
import toast from "react-hot-toast";
import {
  LayoutDashboard, Users, Building2, BookOpen, FileText, Star,
  Bell, LogOut, Menu, X, ChevronRight, GraduationCap,
  Briefcase, ClipboardList, Calendar, BarChart3, MessageSquare,
  Settings, UserCheck, Award
} from "lucide-react";

const getNavLinks = (role) => {
  if (role === "admin") return [
    { section: "Overview", items: [
      { to: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    ]},
    { section: "Management", items: [
      { to: "/admin/students",      icon: GraduationCap, label: "Students" },
      { to: "/admin/faculty",       icon: UserCheck,     label: "Faculty" },
      { to: "/admin/companies",     icon: Building2,     label: "Companies" },
      { to: "/admin/internships",   icon: Briefcase,     label: "Internships" },
      { to: "/admin/users",         icon: Users,         label: "All Users" },
      { to: "/admin/applications",  icon: ClipboardList, label: "Applications" },
    ]},
    { section: "Reports & Feedback", items: [
      { to: "/admin/reports",          icon: BarChart3,     label: "Reports" },
      { to: "/admin/system-feedback",  icon: MessageSquare, label: "System Feedback" },
    ]},
  ];
  if (role === "faculty") return [
    { section: "Overview", items: [
      { to: "/faculty/dashboard",          icon: LayoutDashboard, label: "Dashboard" },
    ]},
    { section: "Internships", items: [
      { to: "/faculty/browse-internships", icon: Briefcase,      label: "Browse Internships" },
      { to: "/faculty/internships",        icon: BookOpen,       label: "Post Internship" },
      { to: "/faculty/applications",       icon: ClipboardList,  label: "Applications" },
      { to: "/faculty/interviews",         icon: Calendar,       label: "Interviews" },
      { to: "/faculty/evaluations",        icon: Award,          label: "Evaluations" },
    ]},
    { section: "Reports", items: [
      { to: "/faculty/reports",            icon: BarChart3, label: "Reports" },
    ]},
  ];
  // student
  return [
    { section: "Overview", items: [
      { to: "/student/dashboard",    icon: LayoutDashboard, label: "Dashboard" },
      { to: "/student/profile",      icon: Users,           label: "My Profile" },
    ]},
    { section: "Internships", items: [
      { to: "/student/internships",  icon: Briefcase,      label: "Browse Internships" },
      { to: "/student/applications", icon: ClipboardList,  label: "My Applications" },
      { to: "/student/interviews",   icon: Calendar,       label: "Interviews" },
      { to: "/student/evaluations",  icon: Award,          label: "Evaluations" },
    ]},
    { section: "Feedback & Reports", items: [
      { to: "/student/feedback",     icon: Star,       label: "Submit Feedback" },
      { to: "/student/reports",      icon: BarChart3,  label: "My Reports" },
    ]},
  ];
};

export default function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    adminAPI.getNotifications().then(res => {
      setNotifications(res.data.data || []);
      setUnread(res.data.data?.filter(n => !n.is_read).length || 0);
    }).catch(() => {});
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const navLinks = getNavLinks(user?.role);
  const getPageTitle = () => {
    const map = {
      "/admin/dashboard": "Admin Dashboard",
      "/admin/students": "Manage Students",
      "/admin/faculty": "Manage Faculty",
      "/admin/companies": "Manage Companies",
      "/admin/internships": "Manage Internships",
      "/admin/users": "All Users",
      "/admin/reports": "Admin Reports",
      "/admin/system-feedback": "System Feedback",
      "/admin/applications": "Manage Applications",
      "/faculty/dashboard": "Faculty Dashboard",
      "/faculty/internships": "Post Internship",
      "/faculty/browse-internships": "Browse Internships",
      "/faculty/applications": "Review Applications",
      "/faculty/interviews": "Schedule Interviews",
      "/faculty/evaluations": "Evaluations",
      "/faculty/reports": "Faculty Reports",
      "/student/dashboard": "Student Dashboard",
      "/student/profile": "My Profile",
      "/student/internships": "Browse Internships",
      "/student/applications": "My Applications",
      "/student/interviews": "My Interviews",
      "/student/evaluations": "My Evaluations",
      "/student/feedback": "Submit Feedback",
      "/student/reports": "My Reports",
    };
    return map[location.pathname] || "College IMS";
  };

  const initials = user?.profile?.full_name
    ? user.profile.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || "U";

  const roleColor = user?.role === "admin" ? "#ef4444" : user?.role === "faculty" ? "#818cf8" : "#06b6d4";

  return (
    <div className="app-layout">
      {/* Overlay for mobile */}
      {sidebarOpen && <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:99}} onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <nav className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-logo">
          <div className="logo-icon">🎓</div>
          <div>
            <h1>College IMS</h1>
            <p style={{fontSize:"11px",color:"var(--text-muted)"}}>Internship Management</p>
          </div>
        </div>

        <div className="sidebar-nav">
          {navLinks.map(section => (
            <div className="nav-section" key={section.section}>
              <div className="nav-section-title">{section.section}</div>
              {section.items.map(item => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`nav-link ${location.pathname === item.to ? "active" : ""}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="icon" size={18} />
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
        </div>

        <div className="sidebar-footer">
          <div style={{display:"flex",alignItems:"center",gap:"10px",padding:"10px 12px",marginBottom:"8px"}}>
            <div className="avatar" style={{background:`linear-gradient(135deg, ${roleColor}, #0f172a)`}}>{initials}</div>
            <div style={{flex:1,overflow:"hidden"}}>
              <div style={{fontSize:"13px",fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                {user?.profile?.full_name || user?.email}
              </div>
              <div style={{fontSize:"11px",color:"var(--text-muted)",textTransform:"capitalize"}}>{user?.role}</div>
            </div>
          </div>
          <button className="nav-link" onClick={handleLogout} style={{color:"#ef4444",width:"100%"}}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </nav>

      {/* Header */}
      <header className="header">
        <div className="header-left">
          <button className="btn btn-icon btn-secondary" onClick={() => setSidebarOpen(!sidebarOpen)} style={{display:"flex"}}>
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <span className="page-title">{getPageTitle()}</span>
        </div>
        <div className="header-right">
          {/* Notifications */}
          <div style={{position:"relative"}}>
            <button
              className={`btn btn-icon btn-secondary ${unread > 0 ? "notif-dot" : ""}`}
              onClick={() => setShowNotif(!showNotif)}
            >
              <Bell size={18} />
            </button>
            {showNotif && (
              <div style={{
                position:"absolute", right:0, top:"48px", width:"320px",
                background:"var(--dark-card)", border:"1px solid var(--dark-border)",
                borderRadius:"var(--radius)", boxShadow:"var(--shadow)", zIndex:200
              }}>
                <div style={{padding:"12px 16px",borderBottom:"1px solid var(--dark-border)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontWeight:600}}>Notifications</span>
                  {unread > 0 && (
                    <button className="btn btn-sm btn-secondary" onClick={() => {
                      adminAPI.markAllRead().then(() => {
                        setNotifications(prev => prev.map(n => ({...n, is_read:1})));
                        setUnread(0);
                        setShowNotif(false);
                      });
                    }}>Mark all read</button>
                  )}
                </div>
                <div style={{ maxHeight: "380px", overflowY: "auto" }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", fontSize: "14px" }}>No notifications</div>
                  ) : notifications.map(n => (
                    <div
                      key={n.id}
                      style={{
                        padding: "12px 16px", borderBottom: "1px solid rgba(51,65,85,0.5)",
                        background: n.is_read ? "transparent" : "rgba(79,70,229,0.08)",
                        cursor: n.link ? "pointer" : "default"
                      }}
                      onClick={() => {
                        if (!n.is_read) {
                          adminAPI.markNotificationRead(n.id).catch(() => {});
                          setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, is_read: 1 } : x));
                          setUnread(prev => Math.max(0, prev - 1));
                        }
                        if (n.link) {
                          setShowNotif(false);
                          navigate(n.link);
                        }
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
                        <div style={{ fontSize: "13px", fontWeight: n.is_read ? 400 : 600, flex: 1 }}>
                          {!n.is_read && <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: "var(--primary)", marginRight: 6, verticalAlign: "middle" }} />}
                          {n.title}
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                          {new Date(n.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px", whiteSpace: "pre-line" }}>{n.message}</div>
                      {n.link && (
                        <div style={{ fontSize: "11px", color: "var(--primary-light)", marginTop: 4 }}>View Internship →</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="avatar" style={{cursor:"pointer"}} onClick={() => user?.role === "student" && navigate("/student/profile")}>
            {initials}
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="main-content">
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
