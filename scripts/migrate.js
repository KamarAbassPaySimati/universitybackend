const pool = require('../config/database');

const createTables = async () => {
  try {
    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('super-admin', 'admin', 'faculty', 'student')),
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Departments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS departments (
        id SERIAL PRIMARY KEY,
        dept_code VARCHAR(10) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        head_id INTEGER REFERENCES users(id),
        established_year INTEGER,
        budget DECIMAL(12,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Students table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS students (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        student_id VARCHAR(20) UNIQUE NOT NULL,
        department_id INTEGER REFERENCES departments(id),
        program VARCHAR(100),
        year INTEGER,
        admission_date DATE,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Faculty table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS faculty (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        faculty_id VARCHAR(20) UNIQUE NOT NULL,
        department_id INTEGER REFERENCES departments(id),
        designation VARCHAR(50),
        qualification VARCHAR(200),
        experience INTEGER,
        join_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Courses table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS courses (
        id SERIAL PRIMARY KEY,
        course_code VARCHAR(20) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        department_id INTEGER REFERENCES departments(id),
        credits INTEGER,
        semester INTEGER,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Enrollments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS enrollments (
        id SERIAL PRIMARY KEY,
        student_id INTEGER REFERENCES students(id),
        course_id INTEGER REFERENCES courses(id),
        semester VARCHAR(10),
        academic_year VARCHAR(10),
        status VARCHAR(20) DEFAULT 'enrolled',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(student_id, course_id, semester, academic_year)
      )
    `);

    // Grades table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS grades (
        id SERIAL PRIMARY KEY,
        enrollment_id INTEGER REFERENCES enrollments(id),
        assignment1 DECIMAL(5,2) DEFAULT 0,
        assignment2 DECIMAL(5,2) DEFAULT 0,
        mid_sem DECIMAL(5,2) DEFAULT 0,
        end_sem DECIMAL(5,2) DEFAULT 0,
        total DECIMAL(5,2) GENERATED ALWAYS AS (assignment1 + assignment2 + mid_sem + end_sem) STORED,
        letter_grade VARCHAR(2),
        gpa DECIMAL(3,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Attendance table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id SERIAL PRIMARY KEY,
        enrollment_id INTEGER REFERENCES enrollments(id),
        date DATE NOT NULL,
        status VARCHAR(10) CHECK (status IN ('present', 'absent', 'late')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(enrollment_id, date)
      )
    `);

    console.log('✅ All tables created successfully');
    
    // Insert default admin user
    const adminExists = await pool.query('SELECT id FROM users WHERE username = $1', ['admin']);
    if (adminExists.rows.length === 0) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await pool.query(`
        INSERT INTO users (username, email, password_hash, full_name, role)
        VALUES ($1, $2, $3, $4, $5)
      `, ['admin', 'admin@university.edu', hashedPassword, 'System Administrator', 'super-admin']);
      
      console.log('✅ Default admin user created (username: admin, password: admin123)');
    }

  } catch (error) {
    console.error('❌ Migration error:', error);
  } finally {
    pool.end();
  }
};

createTables();