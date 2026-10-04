-- ============================================================
-- COLLEGE INTERNSHIP MANAGEMENT SYSTEM - Stored Procedures
-- procedures.sql
-- ============================================================
USE college_ims;

DELIMITER //

-- ============================================================
-- Procedure 1: Get Admin Dashboard Statistics
-- ============================================================
DROP PROCEDURE IF EXISTS sp_admin_dashboard_stats //
CREATE PROCEDURE sp_admin_dashboard_stats()
BEGIN
    -- Total counts
    SELECT
        (SELECT COUNT(*) FROM students WHERE is_active = 1) AS total_students,
        (SELECT COUNT(*) FROM faculty WHERE is_active = 1) AS total_faculty,
        (SELECT COUNT(*) FROM companies WHERE is_active = 1) AS total_companies,
        (SELECT COUNT(*) FROM internships WHERE status != "archived") AS total_internships,
        (SELECT COUNT(*) FROM applications) AS total_applications,
        (SELECT COUNT(*) FROM applications WHERE status = "accepted") AS accepted_applications,
        (SELECT COUNT(*) FROM applications WHERE status = "rejected") AS rejected_applications,
        (SELECT COUNT(*) FROM applications WHERE status = "pending") AS pending_applications,
        (SELECT COUNT(*) FROM applications WHERE status = "shortlisted") AS shortlisted_applications,
        (SELECT ROUND(COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM students WHERE is_active=1),0), 2)
         FROM students WHERE placement_status = "placed") AS placement_rate,
        (SELECT COALESCE(AVG(i.stipend), 0) FROM internships i WHERE i.status = "approved") AS avg_stipend;
END //

-- ============================================================
-- Procedure 2: Apply for Internship (with duplicate check)
-- ============================================================
DROP PROCEDURE IF EXISTS sp_apply_internship //
CREATE PROCEDURE sp_apply_internship(
    IN p_student_id    INT UNSIGNED,
    IN p_internship_id INT UNSIGNED,
    IN p_cover_letter  TEXT,
    IN p_qualifications TEXT,
    IN p_resume_path   VARCHAR(500),
    OUT p_result       VARCHAR(200)
)
BEGIN
    DECLARE v_count      INT DEFAULT 0;
    DECLARE v_status     VARCHAR(20);
    DECLARE v_deadline   DATE;

    -- Check duplicate
    SELECT COUNT(*) INTO v_count FROM applications
    WHERE student_id = p_student_id AND internship_id = p_internship_id;

    IF v_count > 0 THEN
        SET p_result = "ERROR: You have already applied to this internship.";
    ELSE
        -- Check internship status and deadline
        SELECT status, application_deadline INTO v_status, v_deadline
        FROM internships WHERE id = p_internship_id;

        IF v_status != "approved" THEN
            SET p_result = "ERROR: This internship is not open for applications.";
        ELSEIF v_deadline < CURDATE() THEN
            SET p_result = "ERROR: Application deadline has passed.";
        ELSE
            INSERT INTO applications (student_id, internship_id, cover_letter, qualifications, resume_path)
            VALUES (p_student_id, p_internship_id, p_cover_letter, p_qualifications, p_resume_path);
            SET p_result = "SUCCESS: Application submitted successfully.";
        END IF;
    END IF;
END //

-- ============================================================
-- Procedure 3: Update Application Status and Log
-- ============================================================
DROP PROCEDURE IF EXISTS sp_update_application_status //
CREATE PROCEDURE sp_update_application_status(
    IN p_application_id INT UNSIGNED,
    IN p_status         VARCHAR(20),
    IN p_reviewer_id    INT UNSIGNED,
    IN p_notes          TEXT,
    OUT p_result        VARCHAR(200)
)
BEGIN
    DECLARE v_count INT DEFAULT 0;
    DECLARE v_student_user_id INT UNSIGNED;
    DECLARE v_internship_title VARCHAR(200);

    SELECT COUNT(*) INTO v_count FROM applications WHERE id = p_application_id;

    IF v_count = 0 THEN
        SET p_result = "ERROR: Application not found.";
    ELSEIF p_status NOT IN ("pending","shortlisted","rejected","accepted","withdrawn") THEN
        SET p_result = "ERROR: Invalid status value.";
    ELSE
        UPDATE applications
        SET status = p_status, reviewed_by = p_reviewer_id, reviewed_at = NOW(), review_notes = p_notes
        WHERE id = p_application_id;

        -- Get student user_id and internship title for notification
        SELECT s.user_id, i.title INTO v_student_user_id, v_internship_title
        FROM applications a
        INNER JOIN students s ON a.student_id = s.id
        INNER JOIN internships i ON a.internship_id = i.id
        WHERE a.id = p_application_id;

        -- Create notification for student
        INSERT INTO notifications (user_id, title, message, type)
        VALUES (v_student_user_id,
                CONCAT("Application Status Updated: ", p_status),
                CONCAT("Your application for '", v_internship_title, "' has been ", p_status, "."),
                CASE p_status
                    WHEN "accepted"    THEN "success"
                    WHEN "rejected"    THEN "error"
                    WHEN "shortlisted" THEN "info"
                    ELSE "info"
                END);

        -- Update student placement status if accepted
        IF p_status = "accepted" THEN
            UPDATE students s
            INNER JOIN applications a ON a.student_id = s.id
            SET s.placement_status = "placed"
            WHERE a.id = p_application_id;
        END IF;

        -- Log activity
        INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
        VALUES (p_reviewer_id, "APPLICATION_STATUS", "application", p_application_id,
                CONCAT("Status updated to: ", p_status));

        SET p_result = "SUCCESS: Application status updated.";
    END IF;
END //

-- ============================================================
-- Procedure 4: Get Student Report
-- ============================================================
DROP PROCEDURE IF EXISTS sp_student_report //
CREATE PROCEDURE sp_student_report(IN p_student_id INT UNSIGNED)
BEGIN
    -- Applications summary
    SELECT
        COUNT(*) AS total_applications,
        SUM(CASE WHEN status = "pending"     THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN status = "shortlisted" THEN 1 ELSE 0 END) AS shortlisted,
        SUM(CASE WHEN status = "accepted"    THEN 1 ELSE 0 END) AS accepted,
        SUM(CASE WHEN status = "rejected"    THEN 1 ELSE 0 END) AS rejected,
        SUM(CASE WHEN status = "withdrawn"   THEN 1 ELSE 0 END) AS withdrawn
    FROM applications WHERE student_id = p_student_id;

    -- Application timeline
    SELECT
        a.id, i.title AS internship, c.name AS company,
        a.status, a.applied_at, a.reviewed_at
    FROM applications a
    INNER JOIN internships i ON a.internship_id = i.id
    INNER JOIN companies c ON i.company_id = c.id
    WHERE a.student_id = p_student_id
    ORDER BY a.applied_at DESC;

    -- Upcoming interviews
    SELECT
        iv.id, i.title, c.name AS company,
        iv.interview_date, iv.interview_time,
        iv.interviewer, iv.meeting_link, iv.result
    FROM interviews iv
    INNER JOIN applications a ON iv.application_id = a.id
    INNER JOIN internships i ON a.internship_id = i.id
    INNER JOIN companies c ON i.company_id = c.id
    WHERE a.student_id = p_student_id
      AND iv.interview_date >= CURDATE()
      AND iv.is_cancelled = 0
    ORDER BY iv.interview_date, iv.interview_time;
END //

DELIMITER ;
