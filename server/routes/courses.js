const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');

const router = express.Router();

router.post('/', auth, authorize('staff'), async (req, res) => {
  try {
    const { code, title, faculty, department, semester, session, startDate, endDate } = req.body;
    const existing = await Course.findOne({ code: code.toUpperCase() });
    if (existing) return res.status(400).json({ message: 'Course code exists' });
    const course = await Course.create({
      code: code.toUpperCase(),
      title,
      faculty,
      department,
      lecturer: req.user._id,
      semester,
      session,
      startDate,
      endDate
    });
    res.status(201).json(course);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/mine', auth, authorize('staff'), async (req, res) => {
  try {
    const courses = await Course.find({ lecturer: req.user._id }).sort({ createdAt: -1 });
    res.json(courses);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});

// List enrolled students for a course (staff lecturer only)
router.get('/:courseId/enrollments', auth, authorize('staff'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (String(course.lecturer) !== String(req.user._id)) return res.status(403).json({ message: 'Not course lecturer' });
    const enrolls = await Enrollment.find({ course: course._id }).populate('student', 'firstName lastName email studentId');
    res.json(enrolls.map(e => ({
      id: e._id,
      studentId: e.student?.studentId,
      name: `${e.student?.firstName || ''} ${e.student?.lastName || ''}`.trim(),
      email: e.student?.email,
      student: e.student?._id
    })));
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/enrolled', auth, authorize('student'), async (req, res) => {
  try {
    const enrolls = await Enrollment.find({ student: req.user._id }).populate('course');
    res.json(enrolls.map(e => e.course));
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:courseId/enroll', auth, authorize('staff'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (String(course.lecturer) !== String(req.user._id)) return res.status(403).json({ message: 'Not course lecturer' });
    const { studentIds } = req.body;
    if (!Array.isArray(studentIds) || studentIds.length === 0) return res.status(400).json({ message: 'Provide studentIds' });
    const students = await User.find({ studentId: { $in: studentIds }, role: 'student' });
    const ops = students.map(s => ({ updateOne: { filter: { course: course._id, student: s._id }, update: { course: course._id, student: s._id }, upsert: true } }));
    if (ops.length > 0) await Enrollment.bulkWrite(ops);
    res.json({ enrolled: students.map(s => s.studentId) });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove enrollment by studentId (staff lecturer only)
router.delete('/:courseId/enroll/:studentId', auth, authorize('staff'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (String(course.lecturer) !== String(req.user._id)) return res.status(403).json({ message: 'Not course lecturer' });
    const student = await User.findOne({ studentId: req.params.studentId, role: 'student' });
    if (!student) return res.status(404).json({ message: 'Student not found' });
    await Enrollment.deleteOne({ course: course._id, student: student._id });
    res.json({ removed: req.params.studentId });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/:courseId/complete', auth, authorize('staff'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (String(course.lecturer) !== String(req.user._id)) return res.status(403).json({ message: 'Not course lecturer' });
    course.status = 'completed';
    await course.save();
    res.json(course);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
