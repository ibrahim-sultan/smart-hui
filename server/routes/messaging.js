const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const { ensureLecturerForCourse, ensureStudentEnrolled } = require('../middleware/courseAccess');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Message = require('../models/Message');
const User = require('../models/User');
const Notification = require('../models/Notification');

const router = express.Router();

const computeExpiry = (course) => {
  const end = new Date(course.endDate);
  return end;
};

router.post('/broadcast', auth, authorize('staff'), ensureLecturerForCourse, async (req, res) => {
  try {
    const { content, category } = req.body;
    const expiresAt = computeExpiry(req.course);
    const msg = await Message.create({
      course: req.course._id,
      sender: req.user._id,
      isBroadcast: true,
      category: category || null,
      content,
      expiresAt
    });
    try {
      const enrollments = await Enrollment.find({ course: req.course._id }).select('student');
      if (enrollments.length > 0) {
        const notifications = enrollments.map(e => ({
          title: `New message in ${req.course.code}`,
          message: content.length > 200 ? content.slice(0, 200) + '…' : content,
          type: 'info',
          recipient: e.student
        }));
        await Notification.insertMany(notifications);
      }
    } catch (_) {}
    res.status(201).json(msg);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/private', auth, authorize('staff'), ensureLecturerForCourse, async (req, res) => {
  try {
    const { studentId, content, category } = req.body;
    const student = await User.findOne({ studentId, role: 'student' });
    if (!student) return res.status(404).json({ message: 'Student not found' });
    const enrolled = await Enrollment.findOne({ course: req.course._id, student: student._id });
    if (!enrolled) return res.status(403).json({ message: 'Student not enrolled' });
    const expiresAt = computeExpiry(req.course);
    const msg = await Message.create({
      course: req.course._id,
      sender: req.user._id,
      recipient: student._id,
      isBroadcast: false,
      category: category || null,
      content,
      expiresAt
    });
    try {
      await Notification.create({
        title: `Reply from ${req.course.code}`,
        message: content.length > 200 ? content.slice(0, 200) + '…' : content,
        type: 'success',
        recipient: student._id
      });
    } catch (_) {}
    res.status(201).json(msg);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/course/:courseId', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (req.user.role === 'student') {
      const enrolled = await Enrollment.findOne({ course: course._id, student: req.user._id });
      if (!enrolled) return res.status(403).json({ message: 'Not enrolled' });
      const messages = await Message.find({
        course: course._id,
        $or: [{ recipient: req.user._id }, { recipient: null }]
      }).sort({ createdAt: -1 });
      return res.json(messages);
    }
    if (req.user.role === 'staff') {
      if (String(course.lecturer) !== String(req.user._id)) return res.status(403).json({ message: 'Not course lecturer' });
      const messages = await Message.find({ course: course._id }).sort({ createdAt: -1 });
      return res.json(messages);
    }
    res.status(403).json({ message: 'Forbidden' });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
