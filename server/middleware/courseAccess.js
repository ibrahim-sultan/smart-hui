const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

const ensureLecturerForCourse = async (req, res, next) => {
  try {
    const { courseId } = req.body.courseId ? req.body : req.params;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (!req.user || req.user.role !== 'staff') return res.status(403).json({ message: 'Forbidden' });
    if (String(course.lecturer) !== String(req.user._id)) return res.status(403).json({ message: 'Not course lecturer' });
    req.course = course;
    next();
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

const ensureStudentEnrolled = async (req, res, next) => {
  try {
    const { courseId } = req.body.courseId ? req.body : req.params;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (!req.user || req.user.role !== 'student') return res.status(403).json({ message: 'Forbidden' });
    const enrolled = await Enrollment.findOne({ course: course._id, student: req.user._id });
    if (!enrolled) return res.status(403).json({ message: 'Not enrolled' });
    req.course = course;
    next();
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { ensureLecturerForCourse, ensureStudentEnrolled };
