const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

// Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    
    // Get collection counts from studentrecords
    const studentsCount = await db.collection('students').countDocuments({ status: 'active' });
    const facultyCount = await db.collection('faculty').countDocuments();
    const coursesCount = await db.collection('courses').countDocuments();
    const recordsCount = await db.collection('studentrecords').countDocuments();
    
    // Get unique students and departments from studentrecords collection
    const totalStudents = await db.collection('studentrecords').distinct('registrationNumber');
    const departments = await db.collection('studentrecords').distinct('courseCode');
    const departmentsCount = departments.length;
    
    // Get recent activities (last 5 records)
    const recentRecords = await db.collection('studentrecords')
      .find({})
      .sort({ _id: -1 })
      .limit(5)
      .toArray();
    
    // Get grade distribution based on finalGrade
    const gradeDistribution = await db.collection('studentrecords').aggregate([
      {
        $addFields: {
          letterGrade: {
            $switch: {
              branches: [
                { case: { $gte: ['$finalGrade', 80] }, then: 'A' },
                { case: { $gte: ['$finalGrade', 70] }, then: 'B' },
                { case: { $gte: ['$finalGrade', 60] }, then: 'C' },
                { case: { $gte: ['$finalGrade', 50] }, then: 'D' }
              ],
              default: 'F'
            }
          }
        }
      },
      { $group: { _id: '$letterGrade', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]).toArray();
    
    // Get department stats from studentrecords
    const departmentStats = await db.collection('studentrecords').aggregate([
      {
        $group: {
          _id: '$courseCode',
          studentCount: { $addToSet: '$registrationNumber' },
          totalRecords: { $sum: 1 },
          avgGrade: { $avg: '$finalGrade' }
        }
      },
      {
        $project: {
          name: '$_id',
          student_count: { $size: '$studentCount' },
          total_records: '$totalRecords',
          avg_grade: { $round: ['$avgGrade', 1] }
        }
      },
      { $sort: { student_count: -1 } },
      { $limit: 5 }
    ]).toArray();
    
    // Calculate graduation rate based on grades A and B
    const graduationRate = gradeDistribution.length > 0 ? 
      Math.round((gradeDistribution.filter(g => ['A', 'B'].includes(g._id)).reduce((sum, g) => sum + g.count, 0) / 
      gradeDistribution.reduce((sum, g) => sum + g.count, 0)) * 100 * 10) / 10 : 0;
    
    res.json({
      totals: {
        students: totalStudents.length || studentsCount,
        faculty: facultyCount || 10, // Default faculty count
        courses: departments.length || coursesCount,
        departments: departmentsCount,
        graduationRate: graduationRate
      },
      recentActivities: recentRecords.map(record => ({
        title: `${record.studentName} - ${record.courseName} (${record.finalGrade}%)`,
        time: 'Recent',
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