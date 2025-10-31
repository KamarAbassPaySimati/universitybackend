# University Management System - Backend

Express.js + PostgreSQL backend for the University Management System.

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Database Setup
1. Install PostgreSQL on your system
2. Create a database named `university_db`
3. Update `.env` file with your database credentials

### 3. Run Migrations
```bash
npm run migrate
```

### 4. Start Development Server
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Verify JWT token

### Students
- `GET /api/students` - Get all students
- `POST /api/students` - Create student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

### Faculty
- `GET /api/faculty` - Get all faculty
- `GET /api/faculty/departments` - Get departments
- `POST /api/faculty/departments` - Create department
- `PUT /api/faculty/departments/:id` - Update department

### Academics
- `GET /api/academics/courses` - Get all courses
- `GET /api/academics/grades/:courseId` - Get grades for course
- `PUT /api/academics/grades/:id` - Update grade
- `GET /api/academics/attendance/:courseId` - Get attendance

### Administration
- `GET /api/administration/users` - Get all users
- `POST /api/administration/users` - Create user
- `PUT /api/administration/users/:id` - Update user
- `DELETE /api/administration/users/:id` - Delete user
- `GET /api/administration/reports/:type` - Get reports

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

## Default Login
- Username: `admin`
- Password: `admin123`

## Environment Variables
Copy `.env` file and update with your settings:
- Database credentials
- JWT secret
- Frontend URL for CORS