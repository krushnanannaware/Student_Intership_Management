import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({ baseURL: API_URL, timeout: 15000 });

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally — but skip redirect on /register and /forgot-password
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const path = window.location.pathname;
    if (err.response?.status === 401 && path !== "/login" && path !== "/register" && !path.startsWith("/forgot-password")) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// Auth
export const authAPI = {
  login:          (data) => api.post("/auth/login", data),
  register:       (data) => api.post("/auth/register", data),
  getMe:          ()     => api.get("/auth/me"),
  changePassword: (data) => api.put("/auth/change-password", data),
};

// Forgot Password OTP flow
export const forgotPasswordAPI = {
  requestOTP:    (data) => api.post("/auth/forgot-password/request-otp", data),
  verifyOTP:     (data) => api.post("/auth/forgot-password/verify-otp", data),
  resetPassword: (data) => api.post("/auth/forgot-password/reset-password", data),
};

// Students
export const studentAPI = {
  getAll:       (params) => api.get("/students", { params }),
  getById:      (id)     => api.get(`/students/${id}`),
  getMyProfile: ()       => api.get("/students/my-profile"),
  update:       (id, fd) => api.put(`/students/${id}`, fd),
  deactivate:   (id)     => api.delete(`/students/${id}`),
  getDashboard: ()       => api.get("/students/dashboard"),
};

// Companies
export const companyAPI = {
  getAll:   (params) => api.get("/companies", { params }),
  getById:  (id)     => api.get(`/companies/${id}`),
  create:   (data)   => api.post("/companies", data),
  update:   (id, d)  => api.put(`/companies/${id}`, d),
  archive:  (id)     => api.delete(`/companies/${id}`),
};

// Internships
export const internshipAPI = {
  getAll:   (params)  => api.get("/internships", { params }),
  getById:  (id)      => api.get(`/internships/${id}`),
  create:   (data)    => api.post("/internships", data),
  update:   (id, d)   => api.put(`/internships/${id}`, d),
  approve:  (id, act) => api.put(`/internships/${id}/approve`, { action: act }),
  archive:  (id)      => api.put(`/internships/${id}/archive`),
};

// Applications
export const applicationAPI = {
  getAll:       (params) => api.get("/applications", { params }),
  getById:      (id)     => api.get(`/applications/${id}`),
  apply:        (fd)     => api.post("/applications", fd),
  updateStatus: (id, d)  => api.put(`/applications/${id}/status`, d),
  withdraw:     (id)     => api.put(`/applications/${id}/withdraw`),
};

// Interviews
export const interviewAPI = {
  getAll:    (params) => api.get("/interviews", { params }),
  schedule:  (data)  => api.post("/interviews", data),
  update:    (id, d) => api.put(`/interviews/${id}`, d),
  cancel:    (id)    => api.delete(`/interviews/${id}`),
};

// Evaluations
export const evaluationAPI = {
  getAll:  (params) => api.get("/evaluations", { params }),
  create:  (data)   => api.post("/evaluations", data),
  update:  (id, d)  => api.put(`/evaluations/${id}`, d),
};

// Feedback
export const feedbackAPI = {
  submitStudentFeedback:  (d)    => api.post("/feedback/student", d),
  getStudentFeedback:     (p)    => api.get("/feedback/student", { params: p }),
  submitFacultyFeedback:  (d)    => api.post("/feedback/faculty", d),
  getFacultyFeedback:     ()     => api.get("/feedback/faculty"),
  submitSystemFeedback:   (d)    => api.post("/feedback/system", d),
  getSystemFeedback:      ()     => api.get("/feedback/system"),
  updateSystemFeedback:   (id,d) => api.put(`/feedback/system/${id}`, d),
};

// Admin / Shared
export const adminAPI = {
  getDashboard:          ()  => api.get("/admin/dashboard"),
  getFacultyDashboard:   ()  => api.get("/admin/faculty-dashboard"),
  getAdminReport:        ()  => api.get("/admin/reports/admin"),
  getFacultyReport:      ()  => api.get("/admin/reports/faculty"),
  getStudentReport:      ()  => api.get("/admin/reports/student"),
  getUsers:              ()  => api.get("/admin/users"),
  toggleUserStatus:      (id,d)=> api.put(`/admin/users/${id}/status`, d),
  getDepartments:        ()  => api.get("/admin/departments"),
  getNotifications:      ()  => api.get("/admin/notifications"),
  markNotificationRead:  (id)=> api.put(`/admin/notifications/${id}/read`),
  markAllRead:           ()  => api.put("/admin/notifications/read-all"),
  getAdminApplications:  (p) => api.get("/admin/applications", { params: p }),
  sendSkillSuggestion:   (d) => api.post("/admin/skill-suggestions", d),
  getSkillSuggestions:   ()  => api.get("/admin/skill-suggestions"),
};

export default api;
