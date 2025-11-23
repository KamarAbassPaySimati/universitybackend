const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

// Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    
    // Get collection counts
    const studentsCount = await db.collection('students').countDocuments({ status: 'active' });
    const facultyCount = await db.collection('faculty').countDocuments();
    const coursesCount = await db.collection('courses').countDocuments();
    const gradesCount = await db.collection('grades').countDocuments();
    
    // Get unique departments from grades collection
    const departments = await db.collection('grades').distinct('courseCode');
    const departmentsCount = departments.length;
    
    // Get recent activities (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentGrades = await db.collection('grades')
      .find({ createdAt: { $gte: thirtyDaysAgo } })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();
    
    // Get grade distribution
    const gradeDistribution = await db.collection('grades').aggregate([
      { $match: { letterGrade: { $exists: true, $ne: null } } },
      { $group: { _id: '$letterGrade', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]).toArray();
    
    // Get department stats from grades
    const departmentStats = await db.collection('grades').aggregate([
      {
        $group: {
          _id: '$courseCode',
          studentCount: { $addToSet: '$registrationNumber' },
          totalGrades: { $sum: 1 }
        }
      },
      {
        $project: {
          name: '$_id',
          student_count: { $size: '$studentCount' },
          total_grades: '$totalGrades'
        }
      },
      { $sort: { student_count: -1 } },
      { $limit: 5 }
    ]).toArray();
    
    // Calculate graduation rate (mock calculation based on available data)
    const totalStudents = await db.collection('grades').distinct('registrationNumber');
    const graduationRate = totalStudents.length > 0 ? 
      Math.round((gradeDistribution.filter(g => ['A', 'B'].includes(g._id)).reduce((sum, g) => sum + g.count, 0) / 
      gradeDistribution.reduce((sum, g) => sum + g.count, 0)) * 100 * 10) / 10 : 0;
    
    res.json({
      totals: {
        students: totalStudents.length || studentsCount,
        faculty: facultyCount,
        courses: coursesCount,
        departments: departmentsCount,
        graduationRate: graduationRate
      },
      recentActivities: recentGrades.map(grade => ({
        title: `Grade ${grade.letterGrade} assigned to ${grade.studentName}`,
        time: new Date(grade.createdAt).toLocaleDateString(),
        type: 'grade'
      })),
      gradeDistribution: gradeDistribution.map(g => ({ grade: g._id, count: g.count })),
      departmentStats: departmentStats
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;