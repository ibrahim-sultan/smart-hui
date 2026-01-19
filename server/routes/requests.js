const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const { ensureStudentEnrolled, ensureLecturerForCourse } = require('../middleware/courseAccess');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Request = require('../models/Request');
const categories = require('../utils/requestCategories');

const router = express.Router();

router.post('/', auth, authorize('student'), ensureStudentEnrolled, async (req, res) => {
  try {
    const { category, details, urgency } = req.body;
    const autoResponse = categories[category] || null;
    const autoResolved = !!autoResponse;
    const reqDoc = await Request.create({
      course: req.course._id,
      student: req.user._id,
      category,
      urgency: urgency || 'normal',
      details,
      autoResolved,
      autoResponse
    });
    res.status(201).json(reqDoc);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/queue/:courseId', auth, authorize('staff'), ensureLecturerForCourse, async (req, res) => {
  try {
    const items = await Request.find({ course: req.course._id, status: 'pending' })
      .sort({ urgency: -1, createdAt: 1 })
      .populate('student', 'firstName lastName email studentId');
    res.json(items);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/:id/status', auth, authorize('staff'), async (req, res) => {
  try {
    const { status } = req.body;
    const doc = await Request.findById(req.params.id).populate('course');
    if (!doc) return res.status(404).json({ message: 'Not found' });
    if (String(doc.course.lecturer) !== String(req.user._id)) return res.status(403).json({ message: 'Not course lecturer' });
    doc.status = status;
    doc.updatedAt = Date.now();
    await doc.save();
    res.json(doc);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
