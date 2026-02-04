-- Migration script to add fingerprint credentials column to students table
-- Run this script on your existing database to enable fingerprint login

USE smartin_db;

-- Add fingerprint_credentials column to store WebAuthn credential data (JSON format)
-- This will store an JSON array of credentials since users can have multiple devices
ALTER TABLE students 
ADD COLUMN fingerprint_credentials TEXT NULL DEFAULT NULL 
COMMENT 'JSON array of WebAuthn credentials for biometric login';

-- Add column to track if user has been prompted for fingerprint registration
ALTER TABLE students 
ADD COLUMN fingerprint_prompted TINYINT(1) NOT NULL DEFAULT 0 
COMMENT 'Whether user has been prompted for fingerprint registration';

-- Verify the changes
DESCRIBE students;

SELECT 'Fingerprint columns added successfully!' AS Status;
