import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AppLayout from "./layouts/AppLayout";

// Auth pages
import Login from "./pages/shared/Login";
import Register from "./pages/shared/Register";
import ForgotPassword from "./pages/shared/ForgotPassword";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageStudents from "./pages/admin/ManageStudents";
import ManageCompanies from "./pages/admin/ManageCompanies";
import ManageFaculty from "./pages/admin/ManageFaculty";
import ManageUsers from "./pages/admin/ManageUsers";
import AdminReports from "./pages/admin/AdminReports";
import SystemFeedbackAdmin from "./pages/admin/SystemFeedbackAdmin";
import ManageApplications from "./pages/admin/ManageApplications";
import ManageInternships from "./pages/admin/ManageInternships";

// Faculty pages
import FacultyDashboard from "./pages/faculty/FacultyDashboard";
import PostInternship from "./pages/faculty/PostInternship";
import FacultyBrowseInternships from "./pages/faculty/BrowseInternships";
import ReviewApplications from "./pages/faculty/ReviewApplications";
import ScheduleInterviews from "./pages/faculty/ScheduleInterviews";
import CreateEvaluation from "./pages/faculty/CreateEvaluation";
import FacultyReports from "./pages/faculty/FacultyReports";

// Student pages
import StudentDashboard from "./pages/student/StudentDashboard";
import BrowseInternships from "./pages/student/BrowseInternships";
import MyApplications from "./pages/student/MyApplications";
import MyInterviews from "./pages/student/MyInterviews";
import MyEvaluations from "./pages/student/MyEvaluations";
import SubmitFeedback from "./pages/student/SubmitFeedback";
import StudentProfile from "./pages/student/StudentProfile";
import StudentReports from "./pages/student/StudentReports";

// Shared pages
import InternshipDetail from "./pages/shared/InternshipDetail";
import ApplicationDetail from "./pages/shared/ApplicationDetail";
import NotFound from "./pages/shared/NotFound";

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading"><div className="spinner"/><span>Loading...</span></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

const DashboardRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "admin")   return <Navigate to="/admin/dashboard" replace />;
  if (user.role === "faculty") return <Navigate to="/faculty/dashboard" replace />;
  return <Navigate to="/student/dashboard" replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{
          style: { background: "#1e293b", color: "#f1f5f9", border: "1px solid #334155" },
          success: { iconTheme: { primary: "#10b981", secondary: "#1e293b" } },
          error: {
            duration: 5000,
            iconTheme: { primary: "#ef4444", secondary: "#1e293b" }
          }
        }} />
        <Routes>
          {/* Public routes */}
          <Route path="/login"           element={<Login />} />
          <Route path="/register"        element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Protected routes wrapped in AppLayout */}
          <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route index element={<DashboardRedirect />} />

            {/* Admin routes */}
            <Route path="admin">
              <Route path="dashboard"       element={<ProtectedRoute roles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
              <Route path="students"        element={<ProtectedRoute roles={["admin"]}><ManageStudents /></ProtectedRoute>} />
              <Route path="companies"       element={<ProtectedRoute roles={["admin"]}><ManageCompanies /></ProtectedRoute>} />
              <Route path="internships"     element={<ProtectedRoute roles={["admin"]}><ManageInternships /></ProtectedRoute>} />
              <Route path="faculty"         element={<ProtectedRoute roles={["admin"]}><ManageFaculty /></ProtectedRoute>} />
              <Route path="users"           element={<ProtectedRoute roles={["admin"]}><ManageUsers /></ProtectedRoute>} />
              <Route path="reports"         element={<ProtectedRoute roles={["admin"]}><AdminReports /></ProtectedRoute>} />
              <Route path="system-feedback" element={<ProtectedRoute roles={["admin"]}><SystemFeedbackAdmin /></ProtectedRoute>} />
              <Route path="applications"    element={<ProtectedRoute roles={["admin"]}><ManageApplications /></ProtectedRoute>} />
            </Route>

            {/* Faculty routes */}
            <Route path="faculty">
              <Route path="dashboard"          element={<ProtectedRoute roles={["faculty"]}><FacultyDashboard /></ProtectedRoute>} />
              <Route path="internships"         element={<ProtectedRoute roles={["faculty"]}><PostInternship /></ProtectedRoute>} />
              <Route path="browse-internships"  element={<ProtectedRoute roles={["faculty"]}><FacultyBrowseInternships /></ProtectedRoute>} />
              <Route path="applications"        element={<ProtectedRoute roles={["faculty"]}><ReviewApplications /></ProtectedRoute>} />
              <Route path="interviews"          element={<ProtectedRoute roles={["faculty"]}><ScheduleInterviews /></ProtectedRoute>} />
              <Route path="evaluations"         element={<ProtectedRoute roles={["faculty"]}><CreateEvaluation /></ProtectedRoute>} />
              <Route path="reports"             element={<ProtectedRoute roles={["faculty"]}><FacultyReports /></ProtectedRoute>} />
            </Route>

            {/* Student routes */}
            <Route path="student">
              <Route path="dashboard"    element={<ProtectedRoute roles={["student"]}><StudentDashboard /></ProtectedRoute>} />
              <Route path="internships"  element={<ProtectedRoute roles={["student"]}><BrowseInternships /></ProtectedRoute>} />
              <Route path="applications" element={<ProtectedRoute roles={["student"]}><MyApplications /></ProtectedRoute>} />
              <Route path="interviews"   element={<ProtectedRoute roles={["student"]}><MyInterviews /></ProtectedRoute>} />
              <Route path="evaluations"  element={<ProtectedRoute roles={["student"]}><MyEvaluations /></ProtectedRoute>} />
              <Route path="feedback"     element={<ProtectedRoute roles={["student"]}><SubmitFeedback /></ProtectedRoute>} />
              <Route path="profile"      element={<ProtectedRoute roles={["student"]}><StudentProfile /></ProtectedRoute>} />
              <Route path="reports"      element={<ProtectedRoute roles={["student"]}><StudentReports /></ProtectedRoute>} />
            </Route>

            {/* Shared routes */}
            <Route path="internships/:id"   element={<InternshipDetail />} />
            <Route path="applications/:id"  element={<ApplicationDetail />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
