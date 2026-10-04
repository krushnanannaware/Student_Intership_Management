-- ============================================================
-- COLLEGE INTERNSHIP MANAGEMENT SYSTEM - Seed Data
-- seed.sql | Run AFTER schema.sql
-- Passwords: Admin@123, Faculty@123, Student@123
-- (all bcrypt-hashed, cost factor 10)
-- ============================================================
USE college_ims;

SET FOREIGN_KEY_CHECKS = 0;

-- Departments
INSERT INTO departments (name, code) VALUES
  ("Computer Science & Engineering", "CSE"),
  ("Information Technology", "IT"),
  ("Electronics & Communication", "ECE"),
  ("Mechanical Engineering", "ME"),
  ("Civil Engineering", "CE"),
  ("Data Science", "DS"),
  ("Artificial Intelligence", "AI")
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- ============================================================
-- USERS (passwords are bcrypt hashes - cost factor 10)
-- All demo users have password: password
-- Hash below is bcryptjs-compatible (Node.js)
-- ============================================================

-- Admin user
INSERT INTO users (email, password, role) VALUES
  ("admin@college.edu", "$2b$10$McOhByVEV2TVz7kYhtYXJ.OWYGu98DSAw4EzdpzU14eu0nhGjSve6", "admin")
ON DUPLICATE KEY UPDATE id=id;

-- Faculty users
INSERT INTO users (email, password, role) VALUES
  ("faculty.raj@college.edu",   "$2b$10$McOhByVEV2TVz7kYhtYXJ.OWYGu98DSAw4EzdpzU14eu0nhGjSve6", "faculty"),
  ("faculty.priya@college.edu", "$2b$10$McOhByVEV2TVz7kYhtYXJ.OWYGu98DSAw4EzdpzU14eu0nhGjSve6", "faculty"),
  ("faculty.kumar@college.edu", "$2b$10$McOhByVEV2TVz7kYhtYXJ.OWYGu98DSAw4EzdpzU14eu0nhGjSve6", "faculty")
ON DUPLICATE KEY UPDATE id=id;

-- Student users
INSERT INTO users (email, password, role) VALUES
  ("arjun.sharma@student.edu",   "$2b$10$McOhByVEV2TVz7kYhtYXJ.OWYGu98DSAw4EzdpzU14eu0nhGjSve6", "student"),
  ("priya.nair@student.edu",     "$2b$10$McOhByVEV2TVz7kYhtYXJ.OWYGu98DSAw4EzdpzU14eu0nhGjSve6", "student"),
  ("rohit.verma@student.edu",    "$2b$10$McOhByVEV2TVz7kYhtYXJ.OWYGu98DSAw4EzdpzU14eu0nhGjSve6", "student"),
  ("sneha.patel@student.edu",    "$2b$10$McOhByVEV2TVz7kYhtYXJ.OWYGu98DSAw4EzdpzU14eu0nhGjSve6", "student"),
  ("vikram.singh@student.edu",   "$2b$10$McOhByVEV2TVz7kYhtYXJ.OWYGu98DSAw4EzdpzU14eu0nhGjSve6", "student"),
  ("ananya.reddy@student.edu",   "$2b$10$McOhByVEV2TVz7kYhtYXJ.OWYGu98DSAw4EzdpzU14eu0nhGjSve6", "student"),
  ("karan.mehta@student.edu",    "$2b$10$McOhByVEV2TVz7kYhtYXJ.OWYGu98DSAw4EzdpzU14eu0nhGjSve6", "student"),
  ("deepa.krishnan@student.edu", "$2b$10$McOhByVEV2TVz7kYhtYXJ.OWYGu98DSAw4EzdpzU14eu0nhGjSve6", "student"),
  ("amit.joshi@student.edu",     "$2b$10$McOhByVEV2TVz7kYhtYXJ.OWYGu98DSAw4EzdpzU14eu0nhGjSve6", "student"),
  ("riya.gupta@student.edu",     "$2b$10$McOhByVEV2TVz7kYhtYXJ.OWYGu98DSAw4EzdpzU14eu0nhGjSve6", "student")
ON DUPLICATE KEY UPDATE id=id;

-- Faculty profiles
INSERT INTO faculty (user_id, full_name, phone, department_id, designation, employee_id) VALUES
  ((SELECT id FROM users WHERE email="faculty.raj@college.edu"),   "Dr. Rajesh Kumar",  "9876543210", 1, "Professor",           "FAC001"),
  ((SELECT id FROM users WHERE email="faculty.priya@college.edu"), "Dr. Priya Sharma",  "9876543211", 2, "Associate Professor", "FAC002"),
  ((SELECT id FROM users WHERE email="faculty.kumar@college.edu"), "Mr. Suresh Kumar",  "9876543212", 6, "Assistant Professor", "FAC003")
ON DUPLICATE KEY UPDATE full_name=VALUES(full_name);

-- Student profiles
INSERT INTO students (user_id, full_name, phone, department_id, gpa, enrollment_no, year_of_study) VALUES
  ((SELECT id FROM users WHERE email="arjun.sharma@student.edu"),   "Arjun Sharma",   "9123456701", 1, 3.75, "CSE2022001", 3),
  ((SELECT id FROM users WHERE email="priya.nair@student.edu"),     "Priya Nair",     "9123456702", 1, 3.90, "CSE2022002", 3),
  ((SELECT id FROM users WHERE email="rohit.verma@student.edu"),    "Rohit Verma",    "9123456703", 2, 3.50, "IT2022001",  3),
  ((SELECT id FROM users WHERE email="sneha.patel@student.edu"),    "Sneha Patel",    "9123456704", 2, 3.65, "IT2022002",  3),
  ((SELECT id FROM users WHERE email="vikram.singh@student.edu"),   "Vikram Singh",   "9123456705", 3, 3.40, "ECE2022001", 3),
  ((SELECT id FROM users WHERE email="ananya.reddy@student.edu"),   "Ananya Reddy",   "9123456706", 1, 3.80, "CSE2021001", 4),
  ((SELECT id FROM users WHERE email="karan.mehta@student.edu"),    "Karan Mehta",    "9123456707", 6, 3.55, "DS2022001",  3),
  ((SELECT id FROM users WHERE email="deepa.krishnan@student.edu"), "Deepa Krishnan", "9123456708", 6, 3.70, "DS2022002",  3),
  ((SELECT id FROM users WHERE email="amit.joshi@student.edu"),     "Amit Joshi",     "9123456709", 7, 3.60, "AI2022001",  3),
  ((SELECT id FROM users WHERE email="riya.gupta@student.edu"),     "Riya Gupta",     "9123456710", 7, 3.85, "AI2022002",  3)
ON DUPLICATE KEY UPDATE full_name=VALUES(full_name);

-- Companies
INSERT INTO companies (name, registration_number, industry, location, website, contact_person, contact_email, contact_phone, description, created_by) VALUES
  ("TechCorp Solutions Pvt Ltd",  "CIN-L12345MH2010PLC12345", "Software Development", "Mumbai, Maharashtra",   "https://techcorp.example.com",  "Rajiv Malhotra", "rajiv@techcorp.example.com",  "9800001001", "Leading software development company specializing in enterprise solutions.", (SELECT id FROM users WHERE email="admin@college.edu")),
  ("DataVision Analytics",        "CIN-L23456KA2015PLC23456", "Data Analytics",       "Bangalore, Karnataka",  "https://datavision.example.com","Sunita Rao",     "sunita@datavision.example.com","9800001002", "Analytics firm providing AI-driven business intelligence.",                (SELECT id FROM users WHERE email="admin@college.edu")),
  ("CloudNine Innovations",       "CIN-L34567DL2018PLC34567", "Cloud Computing",      "New Delhi, Delhi",      "https://cloudnine.example.com", "Anil Gupta",     "anil@cloudnine.example.com",  "9800001003", "Cloud infrastructure and DevOps consulting company.",                      (SELECT id FROM users WHERE email="admin@college.edu")),
  ("AI Futures Lab",              "CIN-L45678TN2019PLC45678", "Artificial Intelligence","Chennai, Tamil Nadu",  "https://aifutures.example.com", "Meera Krishnan", "meera@aifutures.example.com", "9800001004", "Research and development in AI/ML applications.",                          (SELECT id FROM users WHERE email="admin@college.edu")),
  ("GreenBuild Engineering",      "CIN-L56789GJ2012PLC56789", "Civil Engineering",    "Ahmedabad, Gujarat",    "https://greenbuild.example.com","Sanjay Shah",    "sanjay@greenbuild.example.com","9800001005", "Sustainable infrastructure and construction company.",                     (SELECT id FROM users WHERE email="admin@college.edu"))
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Internships (created by faculty, company IDs assumed 1-5)
INSERT INTO internships (company_id, title, description, domain, location, duration_weeks, stipend, vacancies, start_date, end_date, application_deadline, requirements, status, created_by, approved_by, approved_at) VALUES
  (1, "Full Stack Web Developer Intern", "Work on React/Node.js applications for enterprise clients. Gain hands-on experience with modern web development.", "Web Development", "Mumbai, Maharashtra", 12, 15000.00, 3, "2026-11-01", "2027-01-24", "2026-10-20", "React, Node.js, MySQL basics", "approved", (SELECT id FROM users WHERE email="faculty.raj@college.edu"), (SELECT id FROM users WHERE email="admin@college.edu"), NOW()),
  (2, "Data Science Intern",             "Analyse large datasets using Python, build ML models, and create dashboards for business insights.", "Data Science",     "Bangalore, Karnataka", 16, 18000.00, 2, "2026-11-15", "2027-03-14", "2026-11-01", "Python, Pandas, Scikit-learn", "approved", (SELECT id FROM users WHERE email="faculty.priya@college.edu"), (SELECT id FROM users WHERE email="admin@college.edu"), NOW()),
  (3, "Cloud Infrastructure Intern",     "Help design and deploy cloud architectures on AWS/Azure. Work with DevOps tools.", "Cloud Computing",  "New Delhi, Delhi",     10, 12000.00, 2, "2026-11-01", "2027-01-10", "2026-10-25", "AWS basics, Linux, Networking", "approved", (SELECT id FROM users WHERE email="faculty.raj@college.edu"), (SELECT id FROM users WHERE email="admin@college.edu"), NOW()),
  (4, "Machine Learning Research Intern","Conduct ML research, implement models, and publish findings. Work alongside PhD researchers.", "AI/ML",            "Chennai, Tamil Nadu",  20, 20000.00, 1, "2026-12-01", "2027-04-19", "2026-11-15", "Python, TensorFlow, Research skills", "approved", (SELECT id FROM users WHERE email="faculty.kumar@college.edu"), (SELECT id FROM users WHERE email="admin@college.edu"), NOW()),
  (5, "Civil Engineering Site Intern",   "Assist on construction site, learn project management and structural analysis.", "Civil Engineering","Ahmedabad, Gujarat",   8,  8000.00, 4, "2026-11-01", "2026-12-27", "2026-10-20", "AutoCAD basics, Site safety", "approved", (SELECT id FROM users WHERE email="faculty.raj@college.edu"), (SELECT id FROM users WHERE email="admin@college.edu"), NOW()),
  (1, "Backend Developer Intern",        "Build RESTful APIs and microservices using Node.js and Express.", "Backend Development","Mumbai, Maharashtra", 12, 14000.00, 2, "2026-11-15", "2027-02-07", "2026-11-05", "Node.js, Express, REST APIs", "approved", (SELECT id FROM users WHERE email="faculty.raj@college.edu"), (SELECT id FROM users WHERE email="admin@college.edu"), NOW()),
  (2, "Business Intelligence Intern",    "Create BI dashboards using Tableau/Power BI. Analyse business KPIs.", "Business Intelligence","Bangalore, Karnataka",8, 10000.00, 3, "2026-11-01", "2026-12-27", "2026-10-22", "Tableau or Power BI, SQL", "approved", (SELECT id FROM users WHERE email="faculty.priya@college.edu"), (SELECT id FROM users WHERE email="admin@college.edu"), NOW()),
  (3, "DevOps Engineering Intern",       "CI/CD pipelines, containerization with Docker, Kubernetes basics.", "DevOps",           "New Delhi, Delhi",     16, 16000.00, 2, "2026-12-01", "2027-03-27", "2026-11-20", "Docker, Linux, Git", "pending", (SELECT id FROM users WHERE email="faculty.raj@college.edu"), NULL, NULL),
  (4, "NLP Research Intern",             "Work on natural language processing projects, sentiment analysis, chatbot development.", "NLP/AI",           "Chennai, Tamil Nadu",  12, 15000.00, 2, "2026-11-15", "2027-02-07", "2026-11-05", "Python, NLTK/SpaCy, ML", "approved", (SELECT id FROM users WHERE email="faculty.kumar@college.edu"), (SELECT id FROM users WHERE email="admin@college.edu"), NOW()),
  (1, "UI/UX Design Intern",             "Design user interfaces and conduct user research for web and mobile applications.", "UI/UX Design",     "Mumbai, Maharashtra",  8,  12000.00, 2, "2026-11-01", "2026-12-27", "2026-10-20", "Figma, Adobe XD, UX research", "approved", (SELECT id FROM users WHERE email="faculty.priya@college.edu"), (SELECT id FROM users WHERE email="admin@college.edu"), NOW());

-- Applications (student IDs 1-10, internship IDs 1-10)
INSERT INTO applications (student_id, internship_id, cover_letter, qualifications, resume_path, status, reviewed_by, reviewed_at, review_notes) VALUES
  (1, 1, "I am passionate about full-stack development and have built several React projects.", "React, Node.js, MySQL, 3.75 GPA", "resumes/demo_resume.pdf", "accepted",    (SELECT id FROM users WHERE email="faculty.raj@college.edu"),  DATE_SUB(NOW(), INTERVAL 15 DAY), "Excellent candidate with strong technical skills."),
  (2, 2, "Data science is my passion. I have completed Python and ML certifications.", "Python, Pandas, ML, 3.90 GPA", "resumes/demo_resume.pdf", "accepted",    (SELECT id FROM users WHERE email="faculty.priya@college.edu"), DATE_SUB(NOW(), INTERVAL 12 DAY), "Top performer in our evaluation."),
  (3, 3, "Interested in cloud technologies. AWS certified cloud practitioner.", "AWS, Linux, Networking, 3.50 GPA", "resumes/demo_resume.pdf", "shortlisted", (SELECT id FROM users WHERE email="faculty.raj@college.edu"),  DATE_SUB(NOW(), INTERVAL 10 DAY), "Good fit, needs technical interview."),
  (4, 7, "Experienced with Tableau and Power BI for business dashboards.", "Tableau, Power BI, SQL, 3.65 GPA", "resumes/demo_resume.pdf", "shortlisted", (SELECT id FROM users WHERE email="faculty.priya@college.edu"), DATE_SUB(NOW(), INTERVAL 8 DAY),  "Strong BI skills."),
  (5, 5, "Eager to gain civil engineering site experience.", "AutoCAD, Site visits, 3.40 GPA", "resumes/demo_resume.pdf", "pending",     NULL, NULL, NULL),
  (6, 4, "Machine learning researcher with publications in NLP.", "Python, TF, Research, 3.80 GPA", "resumes/demo_resume.pdf", "accepted",    (SELECT id FROM users WHERE email="faculty.kumar@college.edu"), DATE_SUB(NOW(), INTERVAL 14 DAY), "Exceptional research background."),
  (7, 2, "Data enthusiast with Kaggle competition experience.", "Python, Pandas, Kaggle, 3.55 GPA", "resumes/demo_resume.pdf", "rejected",    (SELECT id FROM users WHERE email="faculty.priya@college.edu"), DATE_SUB(NOW(), INTERVAL 9 DAY),  "Good but other candidates were stronger."),
  (8, 9, "NLP projects on GitHub, experience with transformers.", "Python, NLTK, Transformers, 3.70 GPA", "resumes/demo_resume.pdf", "pending",     NULL, NULL, NULL),
  (9, 4, "AI/ML enthusiast with deep learning experience.", "Python, TensorFlow, PyTorch, 3.60 GPA", "resumes/demo_resume.pdf", "shortlisted", (SELECT id FROM users WHERE email="faculty.kumar@college.edu"), DATE_SUB(NOW(), INTERVAL 7 DAY),  "Strong ML background."),
  (10, 1, "Full-stack projects with React and Node.js on GitHub.", "React, Node.js, GraphQL, 3.85 GPA", "resumes/demo_resume.pdf", "shortlisted", (SELECT id FROM users WHERE email="faculty.raj@college.edu"),  DATE_SUB(NOW(), INTERVAL 6 DAY),  "Very promising candidate."),
  (1, 6, "Interested in backend microservices architecture.", "Node.js, Express, REST, 3.75 GPA", "resumes/demo_resume.pdf", "pending",     NULL, NULL, NULL),
  (2, 9, "NLP research aligned with my thesis work.", "Python, NLP, Research, 3.90 GPA", "resumes/demo_resume.pdf", "pending",     NULL, NULL, NULL),
  (3, 1, "Full-stack skills complement my cloud background.", "React, Node.js, AWS, 3.50 GPA", "resumes/demo_resume.pdf", "rejected",    (SELECT id FROM users WHERE email="faculty.raj@college.edu"),  DATE_SUB(NOW(), INTERVAL 5 DAY),  "Preferred CSE background candidates."),
  (6, 9, "Second application for NLP research.", "Python, NLP, TF, 3.80 GPA", "resumes/demo_resume.pdf", "accepted",    (SELECT id FROM users WHERE email="faculty.kumar@college.edu"), DATE_SUB(NOW(), INTERVAL 11 DAY), "Excellent background for NLP."),
  (7, 10, "UI/UX design is my secondary interest.", "Figma, UX Research, 3.55 GPA", "resumes/demo_resume.pdf", "pending",     NULL, NULL, NULL);

-- Interviews
INSERT INTO interviews (application_id, scheduled_by, interview_date, interview_time, interviewer, meeting_link, notes, result, result_comments) VALUES
  (1,  (SELECT id FROM users WHERE email="faculty.raj@college.edu"),  DATE_ADD(CURDATE(), INTERVAL 5 DAY),  "10:00:00", "Rajiv Malhotra - TechCorp", "https://meet.google.com/abc-defg-hij", "Technical round: DSA + React", "pending", NULL),
  (2,  (SELECT id FROM users WHERE email="faculty.priya@college.edu"), DATE_ADD(CURDATE(), INTERVAL 3 DAY),  "14:00:00", "Sunita Rao - DataVision",   "https://meet.google.com/xyz-uvwx-yz",  "Data science case study", "pending", NULL),
  (6,  (SELECT id FROM users WHERE email="faculty.kumar@college.edu"), DATE_ADD(CURDATE(), INTERVAL 7 DAY),  "11:00:00", "Dr. Meera Krishnan",        "https://meet.google.com/mno-pqrs-tuv", "Research presentation + ML quiz", "pending", NULL),
  (3,  (SELECT id FROM users WHERE email="faculty.raj@college.edu"),  DATE_ADD(CURDATE(), INTERVAL 2 DAY),  "15:00:00", "Anil Gupta - CloudNine",   "https://meet.google.com/cloud-intern",  "Cloud architecture Q&A", "pending", NULL),
  (9,  (SELECT id FROM users WHERE email="faculty.kumar@college.edu"), DATE_ADD(CURDATE(), INTERVAL 6 DAY),  "10:30:00", "Dr. Meera Krishnan",        "https://meet.google.com/ai-intern",    "ML model discussion", "pending", NULL),
  (10, (SELECT id FROM users WHERE email="faculty.raj@college.edu"),  DATE_ADD(CURDATE(), INTERVAL 4 DAY),  "13:00:00", "Rajiv Malhotra - TechCorp", "https://meet.google.com/tc-intern2",   "Full-stack project review", "pending", NULL),
  (14, (SELECT id FROM users WHERE email="faculty.kumar@college.edu"), DATE_ADD(CURDATE(), INTERVAL 8 DAY),  "09:00:00", "Dr. Meera Krishnan",        "https://meet.google.com/nlp-intern",   "NLP research discussion", "pending", NULL),
  (4,  (SELECT id FROM users WHERE email="faculty.priya@college.edu"), DATE_ADD(CURDATE(), INTERVAL 9 DAY),  "11:30:00", "Sunita Rao - DataVision",   "https://meet.google.com/bi-intern",    "BI portfolio review", "pending", NULL);

-- Evaluations (for accepted applications)
INSERT INTO evaluations (application_id, evaluated_by, evaluator_type, technical_skills, soft_skills, punctuality, responsibility, teamwork, learning_ability, comments, strengths, improvement_areas, recommend_fulltime) VALUES
  (1,  (SELECT id FROM users WHERE email="faculty.raj@college.edu"),  "faculty", 5, 4, 5, 5, 4, 5, "Outstanding technical performance.", "Problem-solving, communication", "Could improve on documentation", 1),
  (2,  (SELECT id FROM users WHERE email="faculty.priya@college.edu"),"faculty", 5, 5, 5, 5, 5, 5, "Exceptional in all areas.", "Data analysis, leadership", "None significant", 1),
  (6,  (SELECT id FROM users WHERE email="faculty.kumar@college.edu"),"faculty", 5, 4, 4, 5, 4, 5, "Excellent researcher.", "Research, Python skills", "Needs more industry exposure", 1),
  (14, (SELECT id FROM users WHERE email="faculty.kumar@college.edu"),"faculty", 4, 5, 5, 4, 5, 4, "Strong NLP contributions.", "NLP, teamwork", "Algorithm optimization", 1),
  (1,  (SELECT id FROM users WHERE email="admin@college.edu"),        "company", 5, 4, 5, 5, 5, 5, "Best intern we have had.", "Technical depth, eagerness", "Minor: report writing", 1),
  (2,  (SELECT id FROM users WHERE email="admin@college.edu"),        "company", 4, 5, 5, 5, 5, 5, "Very impressive data skills.", "Analytics, communication", "Could improve coding speed", 1),
  (6,  (SELECT id FROM users WHERE email="admin@college.edu"),        "company", 5, 4, 4, 5, 4, 5, "Stellar ML researcher.", "Deep learning, publication", "Industry-application focus", 1),
  (13, (SELECT id FROM users WHERE email="faculty.raj@college.edu"),  "faculty", 3, 4, 4, 3, 4, 4, "Decent performance but lacks depth.", "Enthusiasm", "Technical skills need improvement", 0),
  (7,  (SELECT id FROM users WHERE email="faculty.priya@college.edu"),"faculty", 3, 3, 4, 3, 4, 3, "Average performance.", "Willingness to learn", "Python proficiency", 0),
  (3,  (SELECT id FROM users WHERE email="faculty.raj@college.edu"),  "faculty", 4, 4, 5, 4, 5, 4, "Good cloud foundation.", "Networking, Linux", "AWS depth", 0);

-- Student Feedback
INSERT INTO student_feedback (application_id, company_culture, mentorship_quality, technical_learning, work_environment, overall_experience, comments, suggestions) VALUES
  (1,  5, 4, 5, 5, 5, "Fantastic experience! Learned so much about enterprise software.", "More structured mentorship sessions would help."),
  (2,  5, 5, 5, 5, 5, "Best internship experience. The team was amazing and very supportive.", "More data science projects variety would be great."),
  (6,  4, 5, 5, 4, 5, "Research-driven environment is perfect for PhD aspirants.", "Access to more GPU resources would help."),
  (14, 4, 4, 5, 4, 4, "Excellent NLP project. Learned transformers in depth.", "Would benefit from more pair programming sessions.");

-- Faculty Feedback
INSERT INTO faculty_feedback (internship_id, faculty_id, suitability, course_alignment, student_learning, internship_quality, improvement_suggestions) VALUES
  (1, (SELECT id FROM faculty WHERE employee_id="FAC001"), 5, 4, 5, 5, "Include more system design exposure for completeness."),
  (2, (SELECT id FROM faculty WHERE employee_id="FAC002"), 5, 5, 5, 5, "Perfect alignment with curriculum. Continue the partnership."),
  (4, (SELECT id FROM faculty WHERE employee_id="FAC003"), 5, 5, 5, 5, "Ideal for AI students. Highly recommend expanding intake."),
  (9, (SELECT id FROM faculty WHERE employee_id="FAC003"), 4, 4, 5, 4, "Good NLP exposure. Should include more industry datasets.");

-- System Feedback
INSERT INTO system_feedback (user_id, category, title, description, priority, status) VALUES
  ((SELECT id FROM users WHERE email="arjun.sharma@student.edu"), "feature_request", "Mobile App Version", "Would love a mobile app for tracking application status on the go.", "medium", "open"),
  ((SELECT id FROM users WHERE email="priya.nair@student.edu"),   "improvement",     "Better Notification System", "Email notifications for application status changes would help.", "high", "in_progress"),
  ((SELECT id FROM users WHERE email="faculty.raj@college.edu"),  "bug_report",      "Interview Time Zone Issue", "Interview times should support time zones for remote interviews.", "high", "open"),
  ((SELECT id FROM users WHERE email="admin@college.edu"),        "feature_request", "Bulk Import Students", "Ability to import students via CSV would save a lot of time.", "medium", "open");

-- Activity Logs
INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details) VALUES
  ((SELECT id FROM users WHERE email="admin@college.edu"),        "USER_LOGIN",         "user",       (SELECT id FROM users WHERE email="admin@college.edu"),        "Admin logged in"),
  ((SELECT id FROM users WHERE email="faculty.raj@college.edu"),  "INTERNSHIP_CREATED", "internship", 1, "Created Full Stack Web Developer Intern posting"),
  ((SELECT id FROM users WHERE email="admin@college.edu"),        "INTERNSHIP_APPROVED","internship", 1, "Approved Full Stack Web Developer Intern posting"),
  ((SELECT id FROM users WHERE email="arjun.sharma@student.edu"), "APPLICATION_CREATED","application",1, "Applied to Full Stack Web Developer Intern"),
  ((SELECT id FROM users WHERE email="faculty.raj@college.edu"),  "APPLICATION_STATUS", "application",1, "Updated application status to accepted"),
  ((SELECT id FROM users WHERE email="faculty.raj@college.edu"),  "INTERVIEW_SCHEDULED","interview",  1, "Scheduled interview for Arjun Sharma");

-- Update placement status for accepted students
UPDATE students SET placement_status = "placed" WHERE id IN (1, 2, 6);

SET FOREIGN_KEY_CHECKS = 1;
