# Complete Database Setup - Run after fix-postgres.ps1
Write-Host "Setting up University Management Database..." -ForegroundColor Green

# Connect to PostgreSQL and run setup commands
$setupSQL = @"
-- Set password for postgres user
ALTER USER postgres PASSWORD 'admin123';

-- Create database
CREATE DATABASE university_db;

-- Create admin user
CREATE USER ma_admin WITH PASSWORD 'admin123' SUPERUSER;

-- Connect to university_db and run migration
\c university_db

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('super-admin', 'admin', 'faculty', 'student')),
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Students table
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    student_id VARCHAR(20) UNIQUE NOT NULL,
    program VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL,
    semester INTEGER NOT NULL,
    gpa DECIMAL(3,2) DEFAULT 0.00,
    credits_completed INTEGER DEFAULT 0,
    enrollment_date DATE NOT NULL,
    graduation_date DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'graduated', 'suspended')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Faculty table
CREATE TABLE faculty (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    faculty_id VARCHAR(20) UNIQUE NOT NULL,
    department VARCHAR(100) NOT NULL,
    position VARCHAR(50) NOT NULL,
    hire_date DATE NOT NULL,
    salary DECIMAL(10,2),
    office_location VARCHAR(100),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Departments table
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    dept_code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    head_faculty_id INTEGER REFERENCES faculty(id),
    budget DECIMAL(12,2) DEFAULT 0,
    established_year INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Courses table
CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    course_code VARCHAR(20) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    credits INTEGER NOT NULL,
    department_id INTEGER REFERENCES departments(id),
    prerequisites TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enrollments table
CREATE TABLE enrollments (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    semester VARCHAR(20) NOT NULL,
    year INTEGER NOT NULL,
    grade VARCHAR(5),
    status VARCHAR(20) DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'completed', 'dropped', 'failed')),
    enrollment_date DATE DEFAULT CURRENT_DATE,
    UNIQUE(student_id, course_id, semester, year)
);

-- Grades table
CREATE TABLE grades (
    id SERIAL PRIMARY KEY,
    enrollment_id INTEGER REFERENCES enrollments(id) ON DELETE CASCADE,
    assignment1 DECIMAL(5,2) DEFAULT 0 CHECK (assignment1 >= 0 AND assignment1 <= 20),
    assignment2 DECIMAL(5,2) DEFAULT 0 CHECK (assignment2 >= 0 AND assignment2 <= 20),
    mid_sem DECIMAL(5,2) DEFAULT 0 CHECK (mid_sem >= 0 AND mid_sem <= 20),
    end_sem DECIMAL(5,2) DEFAULT 0 CHECK (end_sem >= 0 AND end_sem <= 60),
    total DECIMAL(5,2) GENERATED ALWAYS AS (assignment1 + assignment2 + mid_sem + end_sem) STORED,
    letter_grade VARCHAR(2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Attendance table
CREATE TABLE attendance (
    id SERIAL PRIMARY KEY,
    enrollment_id INTEGER REFERENCES enrollments(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status VARCHAR(10) NOT NULL CHECK (status IN ('present', 'absent', 'late')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(enrollment_id, date)
);

-- Insert default admin user
INSERT INTO users (username, email, password_hash, role, first_name, last_name) 
VALUES ('admin', 'admin@university.edu', '\$2b\$10\$rQZ8kJZ8kJZ8kJZ8kJZ8kO', 'super-admin', 'System', 'Administrator');

-- Success message
SELECT 'Database setup completed successfully!' as message;
"@

# Save SQL to temp file
$sqlFile = "C:\Users\Dell\Desktop\smssysv1\university-backend\temp-setup.sql"
$setupSQL | Out-File -FilePath $sqlFile -Encoding UTF8

Write-Host "Running database setup..."
try {
    # Run the SQL file
    & psql -U postgres -f $sqlFile
    
    # Clean up temp file
    Remove-Item $sqlFile -Force
    
    Write-Host "`nDatabase setup completed!" -ForegroundColor Green
    Write-Host "Database: university_db" -ForegroundColor Yellow
    Write-Host "Admin user: ma_admin / admin123" -ForegroundColor Yellow
    Write-Host "Postgres user: postgres / admin123" -ForegroundColor Yellow
} catch {
    Write-Host "Error running setup: $_" -ForegroundColor Red
    if (Test-Path $sqlFile) { Remove-Item $sqlFile -Force }
    exit 1
}