-- ============================================================
-- COLLEGE INTERNSHIP MANAGEMENT SYSTEM - Views
-- views.sql
-- ============================================================
USE college_ims;

-- View 1: Student Application History
CREATE OR REPLACE VIEW student_application_history AS
SELECT
    a.id AS application_id,
    s.id AS student_id,
    s.full_name AS student_name,
    s.enrollment_no,
    d.name AS department,
    s.gpa,
    i.title AS internship_title,
    c.name AS company_name,
    i.domain,
    i.location AS internship_location,
    i.stipend,
    a.status AS application_status,
    a.applied_at,
    a.reviewed_at,
    a.review_notes,
    s.placement_status
FROM applications a
INNER JOIN students s ON a.student_id = s.id
INNER JOIN internships i ON a.internship_id = i.id
INNER JOIN companies c ON i.company_id = c.id
INNER JOIN departments d ON s.department_id = d.id;

-- View 2: Internship Statistics
CREATE OR REPLACE VIEW internship_statistics AS
SELECT
    i.id AS internship_id,
    i.title,
    i.domain,
    i.location,
    i.stipend,
    i.duration_weeks,
    i.vacancies,
    i.status,
    c.name AS company_name,
    c.industry,
    COUNT(a.id) AS total_applications,
    SUM(CASE WHEN a.status = "pending"     THEN 1 ELSE 0 END) AS pending_count,
    SUM(CASE WHEN a.status = "shortlisted" THEN 1 ELSE 0 END) AS shortlisted_count,
    SUM(CASE WHEN a.status = "accepted"    THEN 1 ELSE 0 END) AS accepted_count,
    SUM(CASE WHEN a.status = "rejected"    THEN 1 ELSE 0 END) AS rejected_count,
    SUM(CASE WHEN a.status = "withdrawn"   THEN 1 ELSE 0 END) AS withdrawn_count,
    i.application_deadline,
    i.start_date,
    i.end_date,
    i.created_at
FROM internships i
LEFT JOIN companies c ON i.company_id = c.id
LEFT JOIN applications a ON i.id = a.internship_id
GROUP BY i.id, i.title, i.domain, i.location, i.stipend, i.duration_weeks,
         i.vacancies, i.status, c.name, c.industry,
         i.application_deadline, i.start_date, i.end_date, i.created_at;

-- View 3: Company Statistics
CREATE OR REPLACE VIEW company_statistics AS
SELECT
    c.id AS company_id,
    c.name AS company_name,
    c.industry,
    c.location,
    c.is_active,
    COUNT(DISTINCT i.id) AS total_internships,
    SUM(CASE WHEN i.status = "approved" THEN 1 ELSE 0 END) AS approved_internships,
    COUNT(DISTINCT a.id) AS total_applications,
    SUM(CASE WHEN a.status = "accepted" THEN 1 ELSE 0 END) AS accepted_applications,
    COALESCE(AVG(sf.avg_rating), 0) AS avg_student_rating,
    COALESCE(AVG(i.stipend), 0) AS avg_stipend
FROM companies c
LEFT JOIN internships i ON c.id = i.company_id
LEFT JOIN applications a ON i.id = a.internship_id
LEFT JOIN student_feedback sf ON a.id = sf.application_id
GROUP BY c.id, c.name, c.industry, c.location, c.is_active;

-- View 4: Placement Summary
CREATE OR REPLACE VIEW placement_summary AS
SELECT
    d.name AS department,
    COUNT(DISTINCT s.id) AS total_students,
    SUM(CASE WHEN s.placement_status = "placed"     THEN 1 ELSE 0 END) AS placed_students,
    SUM(CASE WHEN s.placement_status = "unplaced"   THEN 1 ELSE 0 END) AS unplaced_students,
    SUM(CASE WHEN s.placement_status = "opted_out"  THEN 1 ELSE 0 END) AS opted_out_students,
    ROUND(SUM(CASE WHEN s.placement_status = "placed" THEN 1 ELSE 0 END) * 100.0 / COUNT(DISTINCT s.id), 2) AS placement_rate_pct,
    COALESCE(AVG(CASE WHEN a.status = "accepted" THEN i.stipend END), 0) AS avg_stipend_placed
FROM students s
INNER JOIN departments d ON s.department_id = d.id
LEFT JOIN applications a ON s.id = a.student_id
LEFT JOIN internships i ON a.internship_id = i.id
WHERE s.is_active = 1
GROUP BY d.id, d.name;

-- View 5: Faculty Application Summary
CREATE OR REPLACE VIEW faculty_application_summary AS
SELECT
    f.id AS faculty_id,
    f.full_name AS faculty_name,
    d.name AS department,
    COUNT(DISTINCT i.id) AS internships_posted,
    COUNT(DISTINCT a.id) AS total_applications,
    SUM(CASE WHEN a.status = "pending"     THEN 1 ELSE 0 END) AS pending_reviews,
    SUM(CASE WHEN a.status = "shortlisted" THEN 1 ELSE 0 END) AS shortlisted_count,
    SUM(CASE WHEN a.status = "accepted"    THEN 1 ELSE 0 END) AS accepted_count,
    SUM(CASE WHEN a.status = "rejected"    THEN 1 ELSE 0 END) AS rejected_count,
    COUNT(DISTINCT iv.id) AS interviews_scheduled,
    COUNT(DISTINCT e.id) AS evaluations_done
FROM faculty f
INNER JOIN departments d ON f.department_id = d.id
LEFT JOIN internships i ON i.created_by = f.user_id
LEFT JOIN applications a ON i.id = a.internship_id
LEFT JOIN interviews iv ON iv.scheduled_by = f.user_id
LEFT JOIN evaluations e ON e.evaluated_by = f.user_id
GROUP BY f.id, f.full_name, d.name;

-- View 6: Student Evaluation Summary
CREATE OR REPLACE VIEW student_evaluation_summary AS
SELECT
    s.id AS student_id,
    s.full_name,
    s.enrollment_no,
    d.name AS department,
    s.gpa,
    COUNT(e.id) AS total_evaluations,
    COALESCE(AVG(e.technical_skills), 0) AS avg_technical,
    COALESCE(AVG(e.soft_skills), 0) AS avg_soft,
    COALESCE(AVG(e.punctuality), 0) AS avg_punctuality,
    COALESCE(AVG(e.responsibility), 0) AS avg_responsibility,
    COALESCE(AVG(e.teamwork), 0) AS avg_teamwork,
    COALESCE(AVG(e.learning_ability), 0) AS avg_learning,
    COALESCE(AVG(e.overall_score), 0) AS avg_overall_score,
    s.placement_status
FROM students s
INNER JOIN departments d ON s.department_id = d.id
LEFT JOIN applications a ON s.id = a.student_id
LEFT JOIN evaluations e ON a.id = e.application_id AND e.is_archived = 0
GROUP BY s.id, s.full_name, s.enrollment_no, d.name, s.gpa, s.placement_status;
