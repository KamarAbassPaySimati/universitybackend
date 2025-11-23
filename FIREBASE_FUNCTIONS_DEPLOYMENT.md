# Firebase Functions Deployment Guide

## Deploy Commands

### 1. Install Dependencies
```bash
cd "c:\Users\Dell\Desktop\Waties code stuff\smssysv1\university-backend\functions"
npm install
```

### 2. Deploy Functions
```bash
cd "c:\Users\Dell\Desktop\Waties code stuff\smssysv1\Paymaart Admin Web Application"
firebase deploy --only functions
```

### 3. Deploy Everything (Frontend + Backend)
```bash
npm run build
firebase deploy
```

## Your API Endpoints
After deployment, your API will be available at:
`https://us-central1-university-management-sy-29964.cloudfunctions.net/api`

### Available Endpoints:
- `GET /api/health` - Health check
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Verify token
- `GET /api/students` - Get all students
- `POST /api/students` - Create student
- `GET /api/faculty` - Get faculty
- `GET /api/dashboard/stats` - Dashboard statistics

## Update Frontend API URL
Update your frontend to use the Firebase Functions URL:
```javascript
// In src/config/database.js
const DB_CONFIG = {
  apiUrl: 'https://us-central1-university-management-sy-29964.cloudfunctions.net/api'
};
```

## Test Login
Username: `admin`
Password: `any password` (demo mode)

## Benefits
- ✅ Serverless backend
- ✅ Auto-scaling
- ✅ Pay per request
- ✅ Integrated with Firebase hosting
- ✅ Same domain (no CORS issues)