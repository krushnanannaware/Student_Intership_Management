-- ============================================================
-- COLLEGE INTERNSHIP MANAGEMENT SYSTEM
-- Database Schema - schema.sql  |  MySQL 8.4+
-- ============================================================

CREATE DATABASE IF NOT EXISTS college_ims CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE college_ims;

SET FOREIGN_KEY_CHECKS = 0;

-- 1. USERS
CREATE TABLE IF NOT EXISTS users (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email       VARCHAR(255) NOT NULL,
    password    VARCHAR(255) NOT NULL,
    role        ENUM("admin","faculty","student") NOT NULL DEFAULT "student",
    is_active   TINYINT(1) NOT NULL DEFAULT 1,
    last_login  DATETIME NULL,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_users_email (email),
    INDEX idx_users_role (role),
    INDEX idx_users_active (is_active)
) ENGINE=InnoDB;

-- 2. DEPARTMENTS
CREATE TABLE IF NOT EXISTS departments (
    id      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name    VARCHAR(100) NOT NULL,
    code    VARCHAR(20)  NOT NULL,
    UNIQUE KEY uq_dept_code (code)
) ENGINE=InnoDB;

-- 3. STUDENTS
CREATE TABLE IF NOT EXISTS students (
    id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id          INT UNSIGNED NOT NULL,
    full_name        VARCHAR(150) NOT NULL,
    phone            VARCHAR(20)  NOT NULL,
    department_id    INT UNSIGNED NOT NULL,
    gpa              DECIMAL(3,2) NOT NULL DEFAULT 0.00,
    enrollment_no    VARCHAR(50)  NOT NULL,
    year_of_study    TINYINT UNSIGNED NOT NULL DEFAULT 1,
    resume_path      VARCHAR(500) NULL,
    placement_status ENUM("unplaced","placed","opted_out") NOT NULL DEFAULT "unplaced",
    is_active        TINYINT(1) NOT NULL DEFAULT 1,
    created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_student_user (user_id),
    UNIQUE KEY uq_enrollment_no (enrollment_no),
    FOREIGN KEY fk_student_user (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY fk_student_dept (department_id) REFERENCES departments(id) ON DELETE RESTRICT,
    INDEX idx_student_dept (department_id),
    INDEX idx_student_gpa (gpa),
    INDEX idx_student_placement (placement_status),
    CONSTRAINT chk_gpa CHECK (gpa >= 0.00 AND gpa <= 4.00),
    CONSTRAINT chk_year CHECK (year_of_study BETWEEN 1 AND 6)
) ENGINE=InnoDB;

-- 4. FACULTY
CREATE TABLE IF NOT EXISTS faculty (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id       INT UNSIGNED NOT NULL,
    full_name     VARCHAR(150) NOT NULL,
    phone         VARCHAR(20)  NOT NULL,
    department_id INT UNSIGNED NOT NULL,
    designation   VARCHAR(100) NOT NULL DEFAULT "Assistant Professor",
    employee_id   VARCHAR(50)  NOT NULL,
    is_active     TINYINT(1) NOT NULL DEFAULT 1,
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_faculty_user (user_id),
    UNIQUE KEY uq_employee_id (employee_id),
    FOREIGN KEY fk_faculty_user (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY fk_faculty_dept (department_id) REFERENCES departments(id) ON DELETE RESTRICT,
    INDEX idx_faculty_dept (department_id)
) ENGINE=InnoDB;

-- 5. COMPANIES
CREATE TABLE IF NOT EXISTS companies (
    id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name                VARCHAR(200) NOT NULL,
    registration_number VARCHAR(100) NOT NULL,
    industry            VARCHAR(100) NOT NULL,
    location            VARCHAR(200) NOT NULL,
    website             VARCHAR(300) NULL,
    contact_person      VARCHAR(150) NOT NULL,
    contact_email       VARCHAR(255) NOT NULL,
    contact_phone       VARCHAR(20)  NOT NULL,
    description         TEXT NULL,
    is_active           TINYINT(1) NOT NULL DEFAULT 1,
    created_by          INT UNSIGNED NOT NULL,
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_reg_number (registration_number),
    FOREIGN KEY fk_company_creator (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_company_industry (industry),
    INDEX idx_company_active (is_active)
) ENGINE=InnoDB;

-- 6. INTERNSHIPS
CREATE TABLE IF NOT EXISTS internships (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    company_id           INT UNSIGNED NOT NULL,
    title                VARCHAR(200) NOT NULL,
    description          TEXT NOT NULL,
    domain               VARCHAR(100) NOT NULL,
    location             VARCHAR(200) NOT NULL,
    duration_weeks       TINYINT UNSIGNED NOT NULL,
    stipend              DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    vacancies            TINYINT UNSIGNED NOT NULL DEFAULT 1,
    start_date           DATE NOT NULL,
    end_date             DATE NOT NULL,
    application_deadline DATE NOT NULL,
    requirements         TEXT NULL,
    status               ENUM("pending","approved","closed","archived") NOT NULL DEFAULT "pending",
    created_by           INT UNSIGNED NOT NULL,
    approved_by          INT UNSIGNED NULL,
    approved_at          DATETIME NULL,
    created_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY fk_intern_company (company_id) REFERENCES companies(id) ON DELETE RESTRICT,
    FOREIGN KEY fk_intern_creator (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY fk_intern_approver (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_intern_company (company_id),
    INDEX idx_intern_domain (domain),
    INDEX idx_intern_status (status),
    INDEX idx_intern_deadline (application_deadline),
    CONSTRAINT chk_duration CHECK (duration_weeks >= 4 AND duration_weeks <= 26),
    CONSTRAINT chk_stipend CHECK (stipend >= 0),
    CONSTRAINT chk_vacancies CHECK (vacancies >= 1),
    CONSTRAINT chk_intern_dates CHECK (end_date > start_date)
) ENGINE=InnoDB;

-- 7. APPLICATIONS
CREATE TABLE IF NOT EXISTS applications (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    student_id    INT UNSIGNED NOT NULL,
    internship_id INT UNSIGNED NOT NULL,
    cover_letter  TEXT NULL,
    qualifications TEXT NULL,
    resume_path   VARCHAR(500) NOT NULL,
    status        ENUM("pending","shortlisted","rejected","accepted","withdrawn") NOT NULL DEFAULT "pending",
    applied_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_by   INT UNSIGNED NULL,
    reviewed_at   DATETIME NULL,
    review_notes  TEXT NULL,
    updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_student_internship (student_id, internship_id),
    FOREIGN KEY fk_app_student (student_id) REFERENCES students(id) ON DELETE RESTRICT,
    FOREIGN KEY fk_app_internship (internship_id) REFERENCES internships(id) ON DELETE RESTRICT,
    FOREIGN KEY fk_app_reviewer (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_app_student (student_id),
    INDEX idx_app_internship (internship_id),
    INDEX idx_app_status (status),
    INDEX idx_app_applied (applied_at)
) ENGINE=InnoDB;

-- 8. INTERVIEWS
CREATE TABLE IF NOT EXISTS interviews (
    id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    application_id INT UNSIGNED NOT NULL,
    scheduled_by   INT UNSIGNED NOT NULL,
    interview_date DATE NOT NULL,
    interview_time TIME NOT NULL,
    interviewer    VARCHAR(200) NOT NULL,
    meeting_link   VARCHAR(500) NULL,
    location       VARCHAR(300) NULL,
    notes          TEXT NULL,
    result         ENUM("pending","passed","failed","no_show","cancelled") NOT NULL DEFAULT "pending",
    result_comments TEXT NULL,
    is_cancelled   TINYINT(1) NOT NULL DEFAULT 0,
    created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY fk_interview_app (application_id) REFERENCES applications(id) ON DELETE RESTRICT,
    FOREIGN KEY fk_interview_scheduler (scheduled_by) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_interview_app (application_id),
    INDEX idx_interview_date (interview_date),
    INDEX idx_interview_result (result)
) ENGINE=InnoDB;

-- 9. EVALUATIONS
CREATE TABLE IF NOT EXISTS evaluations (
    id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    application_id   INT UNSIGNED NOT NULL,
    evaluated_by     INT UNSIGNED NOT NULL,
    evaluator_type   ENUM("faculty","company") NOT NULL,
    technical_skills TINYINT UNSIGNED NOT NULL,
    soft_skills      TINYINT UNSIGNED NOT NULL,
    punctuality      TINYINT UNSIGNED NOT NULL,
    responsibility   TINYINT UNSIGNED NOT NULL,
    teamwork         TINYINT UNSIGNED NOT NULL,
    learning_ability TINYINT UNSIGNED NOT NULL,
    overall_score    DECIMAL(4,2) GENERATED ALWAYS AS (
        (technical_skills + soft_skills + punctuality + responsibility + teamwork + learning_ability) / 6
    ) STORED,
    comments         TEXT NULL,
    strengths        TEXT NULL,
    improvement_areas TEXT NULL,
    recommend_fulltime TINYINT(1) NULL,
    is_archived      TINYINT(1) NOT NULL DEFAULT 0,
    created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY fk_eval_app (application_id) REFERENCES applications(id) ON DELETE RESTRICT,
    FOREIGN KEY fk_eval_by (evaluated_by) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_eval_app (application_id),
    INDEX idx_eval_score (overall_score),
    CONSTRAINT chk_technical CHECK (technical_skills BETWEEN 1 AND 5),
    CONSTRAINT chk_soft CHECK (soft_skills BETWEEN 1 AND 5),
    CONSTRAINT chk_punctuality CHECK (punctuality BETWEEN 1 AND 5),
    CONSTRAINT chk_responsibility CHECK (responsibility BETWEEN 1 AND 5),
    CONSTRAINT chk_teamwork CHECK (teamwork BETWEEN 1 AND 5),
    CONSTRAINT chk_learning CHECK (learning_ability BETWEEN 1 AND 5)
) ENGINE=InnoDB;

-- 10. STUDENT FEEDBACK
CREATE TABLE IF NOT EXISTS student_feedback (
    id                 INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    application_id     INT UNSIGNED NOT NULL,
    company_culture    TINYINT UNSIGNED NOT NULL,
    mentorship_quality TINYINT UNSIGNED NOT NULL,
    technical_learning TINYINT UNSIGNED NOT NULL,
    work_environment   TINYINT UNSIGNED NOT NULL,
    overall_experience TINYINT UNSIGNED NOT NULL,
    avg_rating         DECIMAL(4,2) GENERATED ALWAYS AS (
        (company_culture + mentorship_quality + technical_learning + work_environment + overall_experience) / 5
    ) STORED,
    comments           TEXT NULL,
    suggestions        TEXT NULL,
    is_anonymous       TINYINT(1) NOT NULL DEFAULT 0,
    created_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_student_feedback (application_id),
    FOREIGN KEY fk_sf_app (application_id) REFERENCES applications(id) ON DELETE RESTRICT,
    INDEX idx_sf_rating (avg_rating),
    CONSTRAINT chk_sf_culture CHECK (company_culture BETWEEN 1 AND 5),
    CONSTRAINT chk_sf_mentorship CHECK (mentorship_quality BETWEEN 1 AND 5),
    CONSTRAINT chk_sf_technical CHECK (technical_learning BETWEEN 1 AND 5),
    CONSTRAINT chk_sf_work CHECK (work_environment BETWEEN 1 AND 5),
    CONSTRAINT chk_sf_overall CHECK (overall_experience BETWEEN 1 AND 5)
) ENGINE=InnoDB;

-- 11. FACULTY FEEDBACK
CREATE TABLE IF NOT EXISTS faculty_feedback (
    id                      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    internship_id           INT UNSIGNED NOT NULL,
    faculty_id              INT UNSIGNED NOT NULL,
    suitability             TINYINT UNSIGNED NOT NULL,
    course_alignment        TINYINT UNSIGNED NOT NULL,
    student_learning        TINYINT UNSIGNED NOT NULL,
    internship_quality      TINYINT UNSIGNED NOT NULL,
    avg_rating              DECIMAL(4,2) GENERATED ALWAYS AS (
        (suitability + course_alignment + student_learning + internship_quality) / 4
    ) STORED,
    improvement_suggestions TEXT NULL,
    created_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_faculty_feedback (internship_id, faculty_id),
    FOREIGN KEY fk_ff_internship (internship_id) REFERENCES internships(id) ON DELETE RESTRICT,
    FOREIGN KEY fk_ff_faculty (faculty_id) REFERENCES faculty(id) ON DELETE RESTRICT,
    CONSTRAINT chk_ff_suit CHECK (suitability BETWEEN 1 AND 5),
    CONSTRAINT chk_ff_course CHECK (course_alignment BETWEEN 1 AND 5),
    CONSTRAINT chk_ff_learning CHECK (student_learning BETWEEN 1 AND 5),
    CONSTRAINT chk_ff_quality CHECK (internship_quality BETWEEN 1 AND 5)
) ENGINE=InnoDB;

-- 12. SYSTEM FEEDBACK
CREATE TABLE IF NOT EXISTS system_feedback (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id     INT UNSIGNED NOT NULL,
    category    ENUM("feature_request","bug_report","general","improvement") NOT NULL DEFAULT "general",
    title       VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    priority    ENUM("low","medium","high","critical") NOT NULL DEFAULT "medium",
    status      ENUM("open","in_progress","resolved","closed","wont_fix") NOT NULL DEFAULT "open",
    admin_notes TEXT NULL,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY fk_sysfb_user (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_sysfb_status (status),
    INDEX idx_sysfb_category (category)
) ENGINE=InnoDB;

-- 13. ACTIVITY LOGS
CREATE TABLE IF NOT EXISTS activity_logs (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id     INT UNSIGNED NULL,
    action      VARCHAR(200) NOT NULL,
    entity_type VARCHAR(100) NULL,
    entity_id   INT UNSIGNED NULL,
    details     TEXT NULL,
    ip_address  VARCHAR(45) NULL,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY fk_log_user (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_log_user (user_id),
    INDEX idx_log_action (action),
    INDEX idx_log_created (created_at)
) ENGINE=InnoDB;

-- 14. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
    id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id    INT UNSIGNED NOT NULL,
    title      VARCHAR(200) NOT NULL,
    message    TEXT NOT NULL,
    type       ENUM("info","success","warning","error") NOT NULL DEFAULT "info",
    is_read    TINYINT(1) NOT NULL DEFAULT 0,
    link       VARCHAR(500) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY fk_notif_user (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_notif_user (user_id),
    INDEX idx_notif_read (is_read)
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;
