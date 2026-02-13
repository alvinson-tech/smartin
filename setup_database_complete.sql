-- Complete Database Setup for SMARTIN with User Registration Support
-- Run this script to set up the database from scratch

-- Create database
CREATE DATABASE IF NOT EXISTS smartin_db;
USE smartin_db;

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS marks;
DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS subjects;
DROP TABLE IF EXISTS students;

-- Create students table with registration support
CREATE TABLE students (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usn VARCHAR(50) UNIQUE NOT NULL,
    username VARCHAR(50) NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    semester INT NOT NULL,
    college VARCHAR(200) NOT NULL,
    fingerprint_credentials TEXT NULL DEFAULT NULL COMMENT 'JSON array of WebAuthn credentials for biometric login',
    fingerprint_prompted TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Whether user has been prompted for fingerprint registration',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_usn (usn),
    INDEX idx_username (username)
);

-- Create subjects table (user-specific)
CREATE TABLE subjects (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    INDEX idx_student_id (student_id)
);

-- Create attendance table
CREATE TABLE attendance (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    subject_id INT NOT NULL,
    status ENUM('present', 'absent') NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    INDEX idx_attendance_student (student_id),
    INDEX idx_attendance_subject (subject_id),
    INDEX idx_attendance_date (date)
);

-- Create marks table
CREATE TABLE marks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    subject_id INT NOT NULL,
    ia_number INT NOT NULL,
    marks_obtained DECIMAL(5,2) DEFAULT NULL,
    max_marks DECIMAL(5,2) NOT NULL DEFAULT 50.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    UNIQUE KEY unique_student_subject_ia (student_id, subject_id, ia_number),
    INDEX idx_marks_student (student_id),
    INDEX idx_marks_subject (subject_id)
);

-- Insert a demo student (optional - for testing)
-- Username: 1MJ23CS012, Password: 0902
INSERT INTO students (usn, username, password, name, semester, college) 
VALUES ('1MJ23CS012', '1MJ23CS012', '0902', 'Alvin Sonny', 6, 'MVJ College of Engineering');

-- Get the student ID for demo subjects
SET @demo_student_id = LAST_INSERT_ID();

-- Insert demo subjects for the demo student
INSERT INTO subjects (student_id, name, code) VALUES 
    (@demo_student_id, 'Cloud Computing & Full Stack Application Development', 'MVJ22CS61'),
    (@demo_student_id, 'Cloud Computing Lab', 'MVJ22CS61'),
    (@demo_student_id, 'Machine Learning', 'MVJ22CS62'),
    (@demo_student_id, 'Machine Learning Lab', 'MVJ22CSL66'),
    (@demo_student_id, 'Major Project Phase - I', 'MVJ22CSP65'),
    (@demo_student_id, 'Blockchain Technology', 'MVJ22CS631'),
    (@demo_student_id, 'Indian Knowledge System', 'MVJ22IKK68'),
    (@demo_student_id, 'Cloud Computing (Remedial)', 'MVJ22CS61 (R)'),
    (@demo_student_id, 'Machine Learning (Remedial)', 'MVJ22CS62 (R)'),
    (@demo_student_id, 'Blockchain Technology (Remedial)', 'MVJ22CS631 (R)'),
    (@demo_student_id, 'Library', 'NA'),
    (@demo_student_id, 'Physical Education (PE)', 'NA'),
    (@demo_student_id, 'Integrated Technical Coding (ITT)', 'NA'),
    (@demo_student_id, 'Airline & Airport Management System', 'MVJ22AE644'),
    (@demo_student_id, 'AEC Vertical Level 3 - Robotics', 'MVJ22A6YY3');

-- Display success message
SELECT 'Database setup completed successfully!' AS Status;
SELECT 'Demo account created - Username: 1MJ23CS012, Password: 0902' AS Info;
SELECT 'You can now register new users through the registration page' AS Note;
