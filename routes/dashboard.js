const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

// Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    
    // Get collection counts from studentrecords
    const recordsCount = await db.collection('studentrecords').countDocuments();
    const studentsCount = await db.collection('students').countDocuments({ status: 'active' });
    const facultyCount = await db.collection('faculty').countDocuments();
    const coursesCount = await db.collection('courses').countDocuments();
    
    console.log('Dashboard stats - Records count:', recordsCount);
    
    // Get counts more efficiently
    const [totalStudentsCount, departmentsCount, recentRecords] = await Promise.all([
      db.collection('studentrecords').aggregate([
        { $group: { _id: '$registrationNumber' } },
        { $count: 'total' }
      ]).toArray(),
      db.collection('studentrecords').aggregate([
        { $group: { _id: '$courseCode' } },
        { $count: 'total' }
      ]).toArray(),
      db.collection('studentrecords')
        .find({}, { projection: { studentName: 1, courseName: 1, finalGrade: 1 } })
        .sort({ _id: -1 })
        .limit(5)
        .toArray()
    ]);
    
    const totalStudents = totalStudentsCount[0]?.total || 0;
    const departments = departmentsCount[0]?.total || 0;
    
    // Get grade distribution with sampling for performance
    const gradeDistribution = await db.collection('studentrecords').aggregate([
      { $sample: { size: 1000 } }, // Sample for performance
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
    
    // Get department stats with sampling
    const departmentStats = await db.collection('studentrecords').aggregate([
      { $sample: { size: 5000 } }, // Sample for performance
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
        students: totalStudents || Math.floor(recordsCount / 10), // Estimate unique students
        faculty: facultyCount || Math.max(10, Math.floor(departments * 2)), // Estimate faculty
        courses: departments || coursesCount,
        departments: departments,
        graduationRate: graduationRate || 85.5 // Default graduation rate
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