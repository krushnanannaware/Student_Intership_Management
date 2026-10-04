-- ============================================================
-- COLLEGE INTERNSHIP MANAGEMENT SYSTEM
-- Sample DBMS Queries - sample_queries.sql
-- Demonstrates: SELECT, JOIN, GROUP BY, HAVING, ORDER BY,
--               Aggregate Functions, Subqueries, CASE, VIEWS
-- ============================================================
USE college_ims;

-- ============================================================
-- 1. Basic SELECT with JOIN
-- ============================================================
-- Q1: Get all students with department name
SELECT s.full_name, s.enrollment_no, s.gpa, d.name AS department
FROM students s
INNER JOIN departments d ON s.department_id = d.id
WHERE s.is_active = 1
ORDER BY s.gpa DESC;

-- Q2: Get internships with company details
SELECT i.title, i.domain, i.stipend, i.duration_weeks,
       c.name AS company_name, c.industry, c.location
FROM internships i
INNER JOIN companies c ON i.company_id = c.id
WHERE i.status = 'approved'
ORDER BY i.stipend DESC;

-- ============================================================
-- 2. Aggregate Functions
-- ============================================================
-- Q3: Average GPA per department
SELECT d.name AS department, 
       COUNT(s.id) AS total_students,
       ROUND(AVG(s.gpa), 2) AS avg_gpa,
       MAX(s.gpa) AS max_gpa,
       MIN(s.gpa) AS min_gpa
FROM students s
INNER JOIN departments d ON s.department_id = d.id
WHERE s.is_active = 1
GROUP BY d.id, d.name
ORDER BY avg_gpa DESC;

-- Q4: Application count per internship
SELECT i.title, c.name AS company, i.domain,
       COUNT(a.id) AS total_applications,
       SUM(CASE WHEN a.status = 'accepted'    THEN 1 ELSE 0 END) AS accepted,
       SUM(CASE WHEN a.status = 'rejected'    THEN 1 ELSE 0 END) AS rejected,
       SUM(CASE WHEN a.status = 'shortlisted' THEN 1 ELSE 0 END) AS shortlisted,
       SUM(CASE WHEN a.status = 'pending'     THEN 1 ELSE 0 END) AS pending
FROM internships i
LEFT JOIN companies c ON i.company_id = c.id
LEFT JOIN applications a ON i.id = a.internship_id
GROUP BY i.id, i.title, c.name, i.domain
ORDER BY total_applications DESC;

-- ============================================================
-- 3. HAVING Clause
-- ============================================================
-- Q5: Departments with more than 1 placed student
SELECT d.name AS department, COUNT(s.id) AS placed_students
FROM students s
INNER JOIN departments d ON s.department_id = d.id
WHERE s.placement_status = 'placed'
GROUP BY d.id, d.name
HAVING placed_students > 0
ORDER BY placed_students DESC;

-- Q6: Companies that have received more than 2 applications
SELECT c.name AS company, COUNT(a.id) AS total_applications
FROM companies c
INNER JOIN internships i ON c.id = i.company_id
INNER JOIN applications a ON i.id = a.internship_id
GROUP BY c.id, c.name
HAVING total_applications > 2
ORDER BY total_applications DESC;

-- ============================================================
-- 4. Subqueries
-- ============================================================
-- Q7: Students whose GPA is above average
SELECT s.full_name, s.enrollment_no, s.gpa, d.name AS department
FROM students s
INNER JOIN departments d ON s.department_id = d.id
WHERE s.gpa > (SELECT AVG(gpa) FROM students WHERE is_active = 1)
ORDER BY s.gpa DESC;

-- Q8: Internships with applications above average application count
SELECT i.title, i.domain, c.name AS company,
       (SELECT COUNT(*) FROM applications a WHERE a.internship_id = i.id) AS app_count
FROM internships i
INNER JOIN companies c ON i.company_id = c.id
WHERE (SELECT COUNT(*) FROM applications a WHERE a.internship_id = i.id) >
      (SELECT AVG(cnt) FROM (SELECT COUNT(*) AS cnt FROM applications GROUP BY internship_id) sub)
ORDER BY app_count DESC;

-- ============================================================
-- 5. CASE Expression
-- ============================================================
-- Q9: Categorize students by GPA
SELECT s.full_name, s.gpa, d.name AS department,
       CASE
           WHEN s.gpa >= 3.75 THEN 'Distinction'
           WHEN s.gpa >= 3.50 THEN 'First Class'
           WHEN s.gpa >= 3.00 THEN 'Second Class'
           ELSE 'Pass'
       END AS grade_category,
       CASE s.placement_status
           WHEN 'placed'    THEN 'Placed ✓'
           WHEN 'unplaced'  THEN 'Not Placed'
           WHEN 'opted_out' THEN 'Opted Out'
       END AS placement_label
FROM students s
INNER JOIN departments d ON s.department_id = d.id
WHERE s.is_active = 1
ORDER BY s.gpa DESC;

-- ============================================================
-- 6. LEFT JOIN to find students without applications
-- ============================================================
-- Q10: Students who have not applied for any internship
SELECT s.full_name, s.enrollment_no, d.name AS department, s.gpa
FROM students s
INNER JOIN departments d ON s.department_id = d.id
LEFT JOIN applications a ON s.id = a.student_id
WHERE a.id IS NULL AND s.is_active = 1;

-- ============================================================
-- 7. Complex JOIN Query
-- ============================================================
-- Q11: Full application history with all details
SELECT 
    s.full_name AS student_name,
    s.enrollment_no,
    s.gpa,
    d.name AS department,
    i.title AS internship_title,
    i.domain,
    i.stipend,
    c.name AS company_name,
    c.industry,
    a.status AS application_status,
    a.applied_at,
    a.reviewed_at,
    COALESCE(f.full_name, 'Pending Review') AS reviewed_by
FROM applications a
INNER JOIN students s ON a.student_id = s.id
INNER JOIN departments d ON s.department_id = d.id
INNER JOIN internships i ON a.internship_id = i.id
INNER JOIN companies c ON i.company_id = c.id
LEFT JOIN users u ON a.reviewed_by = u.id
LEFT JOIN faculty f ON u.id = f.user_id
ORDER BY a.applied_at DESC;

-- ============================================================
-- 8. Placement Rate Report
-- ============================================================
-- Q12: Overall placement statistics
SELECT
    COUNT(DISTINCT s.id) AS total_students,
    SUM(CASE WHEN s.placement_status = 'placed'    THEN 1 ELSE 0 END) AS placed,
    SUM(CASE WHEN s.placement_status = 'unplaced'  THEN 1 ELSE 0 END) AS unplaced,
    SUM(CASE WHEN s.placement_status = 'opted_out' THEN 1 ELSE 0 END) AS opted_out,
    ROUND(SUM(CASE WHEN s.placement_status = 'placed' THEN 1 ELSE 0 END) * 100.0 / COUNT(DISTINCT s.id), 2) AS placement_rate_pct,
    ROUND(AVG(CASE WHEN a.status = 'accepted' THEN i.stipend END), 2) AS avg_stipend_placed
FROM students s
LEFT JOIN applications a ON s.id = a.student_id AND a.status = 'accepted'
LEFT JOIN internships i ON a.internship_id = i.id
WHERE s.is_active = 1;

-- ============================================================
-- 9. UPDATE examples
-- ============================================================
-- Update student GPA (parameterized in production)
-- UPDATE students SET gpa = 3.85 WHERE enrollment_no = 'CSE2022001';

-- Soft delete a student
-- UPDATE students SET is_active = 0 WHERE id = 1;
-- UPDATE users SET is_active = 0 WHERE id = (SELECT user_id FROM students WHERE id = 1);

-- ============================================================
-- 10. Using Views
-- ============================================================
SELECT * FROM student_application_history ORDER BY applied_at DESC LIMIT 10;
SELECT * FROM internship_statistics ORDER BY total_applications DESC LIMIT 5;
SELECT * FROM company_statistics ORDER BY total_applications DESC;
SELECT * FROM placement_summary;
SELECT * FROM faculty_application_summary;
SELECT * FROM student_evaluation_summary ORDER BY avg_overall_score DESC LIMIT 5;
