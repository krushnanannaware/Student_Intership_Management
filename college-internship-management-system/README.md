# 🎓 College Internship Management System (CIMS)

A complete, production-ready College Internship Management System built as a DBMS project.
Full-stack: React + Express.js + MySQL 8.

---

## 🌟 Features

### Admin
- Dashboard with charts (placement rate, application distribution, domain stats)
- Manage Students, Faculty, Companies, Users
- Approve/Reject internship postings
- View all applications, interviews, evaluations
- Reports & analytics
- System feedback management
- Activity logs

### Faculty
- Post internship opportunities
- Review & shortlist applications
- Schedule interviews (24h notice enforced)
- Create evaluations with star ratings
- Faculty reports & analytics

### Student
- Browse & filter available internships
- Apply with cover letter & resume (PDF, max 5MB)
- Track application status & timeline
- View upcoming interviews with meeting links
- View evaluations with radar charts
- Submit feedback on internships
- Profile management with password change

---

## 💻 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 5, React Router 6, Recharts |
| Backend | Node.js 20, Express.js 5, JWT, bcrypt, Multer |
| Database | MySQL 8.4 |
| Auth | JWT + bcrypt (cost factor 10) |
| HTTP Client | Axios |

---

## 🗄 Database

**14 Tables:** users, departments, students, faculty, companies, internships, applications, interviews, evaluations, student_feedback, faculty_feedback, system_feedback, activity_logs, notifications

**6 Views:** student_application_history, internship_statistics, company_statistics, placement_summary, faculty_application_summary, student_evaluation_summary

**Key constraints:**
- UNIQUE (student_id, internship_id) — prevents duplicate applications
- CHECK (gpa BETWEEN 0.00 AND 4.00)
- CHECK (duration_weeks BETWEEN 4 AND 26)
- GENERATED columns for computed evaluation scores

---

## 🚀 Installation & Setup

### Prerequisites
- Node.js 20+
- MySQL 8.0+

### 1. Clone / navigate to project
```
cd college-internship-management-system
```

### 2. Configure environment
```
# Edit .env file in project root
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=college_ims
JWT_SECRET=college_ims_super_secret_jwt_key_2024_dont_share
PORT=5000
FRONTEND_URL=http://localhost:5173
```

### 3. Set up database
```
# Windows PowerShell
Get-Content database\schema.sql | & "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe" -u root -pYourPassword college_ims
Get-Content database\seed.sql   | & "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe" -u root -pYourPassword college_ims
Get-Content database\views.sql  | & "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe" -u root -pYourPassword college_ims
Get-Content database\procedures.sql | & "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe" -u root -pYourPassword college_ims
```

### 4. Install & start backend
```
cd backend
npm install
npm run dev     # starts on port 5000
```

### 5. Install & start frontend
```
cd frontend
npm install
npm run dev     # starts on port 5173
```

### 6. Open browser
```
http://localhost:5173
```

---

## 🔐 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@college.edu | password |
| Faculty | faculty.raj@college.edu | password |
| Faculty | faculty.priya@college.edu | password |
| Student | arjun.sharma@student.edu | password |
| Student | priya.nair@student.edu | password |
| Student | rohit.verma@student.edu | password |

---

## 📡 API Documentation

### Auth
```
POST /api/auth/register    — Register new user
POST /api/auth/login       — Login (returns JWT)
GET  /api/auth/me          — Get current user profile
PUT  /api/auth/change-password
```

### Students
```
GET  /api/students/dashboard   — Student dashboard data
GET  /api/students/my-profile  — Own profile
GET  /api/students             — List all (admin/faculty)
PUT  /api/students/:id         — Update profile
DELETE /api/students/:id       — Soft delete (admin only)
```

### Internships
```
GET  /api/internships              — List all (role-filtered)
POST /api/internships              — Create (faculty/admin)
PUT  /api/internships/:id          — Update
PUT  /api/internships/:id/approve  — Approve/reject (admin)
PUT  /api/internships/:id/archive  — Archive
```

### Applications
```
GET  /api/applications             — List (role-filtered)
POST /api/applications             — Apply (student, with PDF)
PUT  /api/applications/:id/status  — Update status (faculty/admin)
PUT  /api/applications/:id/withdraw — Withdraw (student)
```

---

## 📊 Sample Data

- 10 Students (3 placed, 7 unplaced)
- 3 Faculty (3 departments)
- 5 Companies (TechCorp, DataVision, CloudNine, AI Futures, GreenBuild)
- 10 Internships (9 approved, 1 pending)
- 15 Applications (4 accepted, 2 rejected, 4 shortlisted, 5 pending)
- 8 Interviews (all upcoming)
- 10 Evaluations
- 4 Student feedback records
- 4 Faculty feedback records

---

## 🔒 Security

- Passwords: bcrypt hashed, never stored in plaintext
- Auth: JWT in Authorization header, verified server-side on every request
- RBAC: `authenticateUser` + `authorizeRole()` middleware on every route
- Files: PDF-only filter, 5MB limit, stored in backend/uploads/
- SQL: Parameterized queries via mysql2 prepared statements
- CORS: Restricted to configured FRONTEND_URL

---

## 📁 Project Structure

```
college-internship-management-system/
├── .env
├── .gitignore
├── database/
│   ├── schema.sql
│   ├── seed.sql
│   ├── views.sql
│   ├── procedures.sql
│   └── sample_queries.sql
├── backend/
│   ├── package.json
│   ├── uploads/resumes/
│   └── src/
│       ├── server.js
│       ├── config/db.js
│       ├── middleware/ (auth.js, upload.js, errorHandler.js)
│       ├── controllers/ (auth, student, company, internship,
│       │                  application, interview, evaluation,
│       │                  feedback, admin)
│       └── routes/ (8 route files)
└── frontend/
    ├── vite.config.js
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── index.css
        ├── context/AuthContext.jsx
        ├── services/api.js
        ├── layouts/AppLayout.jsx
        └── pages/
            ├── admin/ (7 pages)
            ├── faculty/ (6 pages)
            ├── student/ (8 pages)
            └── shared/ (4 pages)
```

---

## 🔮 Future Scope

1. Email notifications (Nodemailer/SendGrid)
2. Resume parsing & ATS scoring
3. Mobile app (React Native)
4. Real-time notifications (Socket.io)
5. AI-powered internship matching
6. Export to Excel/PDF reports
7. Multi-college support
