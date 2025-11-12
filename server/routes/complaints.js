const express = require('express');
const { body, validationResult } = require('express-validator');
const Complaint = require('../models/Complaint');
const Notification = require('../models/Notification');
const Admin = require('../models/Admin');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');
const bothAuth = require('../middleware/bothAuth');

const router = express.Router();

// @route   GET /api/complaints
// @desc    Get all complaints (with filters)
// @access  Private (Admin/Student)
router.get('/', bothAuth, async (req, res) => {
  try {
    const { status, category, priority, page = 1, limit = 10 } = req.query;
    
    let query = {};
    
    // Apply filters based on principal
    if (req.user && req.user.role === 'student') {
      query.submittedBy = req.user.id;
    } else if (req.admin) {
      // Admin can only see complaints in their authorized categories (unless super_admin or full access)
      if (req.admin.adminLevel !== 'super_admin' && !(req.admin.permissions && req.admin.permissions.canSeeAllComplaints)) {
        query.category = { $in: req.admin.permissions?.visibleCategories || [] };
      }
    }
    
    if (status) query.status = status;
    if (category) {
      // Check if admin has access to this category
      if (req.admin) {
        const hasAll = req.admin.permissions?.canSeeAllComplaints;
        const list = req.admin.permissions?.visibleCategories || [];
        if (req.admin.adminLevel !== 'super_admin' && !hasAll && !list.includes(category)) {
          return res.status(403).json({ message: 'Access denied to this category' });
        }
      }
      query.category = category;
    }
    if (priority) query.priority = priority;

    const complaints = await Complaint.find(query)
      .populate('submittedBy', 'firstName lastName email studentId')
      .populate('assignedTo', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Complaint.countDocuments(query);

    res.json({
      complaints,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/complaints/:id
// @desc    Get complaint by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('submittedBy', 'firstName lastName email studentId')
      .populate('assignedTo', 'firstName lastName email')
      .populate('comments.author', 'firstName lastName email');

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Check if user has access to this complaint
    if (req.user.role === 'student' && complaint.submittedBy._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(complaint);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/complaints
// @desc    Create a new complaint
// @access  Private
router.post('/', bothAuth, [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('category').isIn(['academic', 'administrative', 'infrastructure', 'financial', 'network', 'password', 'additional_credit', 'other']).withMessage('Invalid category'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, category, priority } = req.body;

    const submittedBy = req.user ? req.user.id : null;
    const complaint = new Complaint({
      title,
      description,
      category,
      priority: priority || 'medium',
      submittedBy
    });

    await complaint.save();

    // Create notification for admin
    const adminUsers = await User.find({ role: 'admin' });
    for (const admin of adminUsers) {
      const notification = new Notification({
        title: 'New Complaint Submitted',
        message: `A new complaint "${title}" has been submitted by ${req.user.firstName} ${req.user.lastName}`,
        type: 'info',
        recipient: admin._id,
        relatedComplaint: complaint._id
      });
      await notification.save();
    }

    res.status(201).json(complaint);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/complaints/:id
// @desc    Update complaint
// @access  Private
router.put('/:id', bothAuth, [
  body('status').optional().isIn(['pending', 'in_progress', 'resolved', 'closed']).withMessage('Invalid status'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
  body('assignedTo').optional().isMongoId().withMessage('Invalid assigned user')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Check permissions
    if (req.user && req.user.role === 'student' && complaint.submittedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { status, priority, assignedTo } = req.body;

    if (status) complaint.status = status;
    if (priority) complaint.priority = priority;
    if (assignedTo && req.admin) complaint.assignedTo = assignedTo;

    await complaint.save();

    // Create notification for status changes
    if (status && status !== 'pending') {
      const notification = new Notification({
        title: 'Complaint Status Updated',
        message: `Your complaint "${complaint.title}" status has been updated to ${status}`,
        type: 'info',
        recipient: complaint.submittedBy,
        relatedComplaint: complaint._id
      });
      await notification.save();
    }

    res.json(complaint);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/complaints/:id
// @desc    Delete complaint
// @access  Private
router.delete('/:id', bothAuth, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Check permissions
    if (req.user && req.user.role === 'student' && complaint.submittedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Complaint.findByIdAndDelete(req.params.id);
    res.json({ message: 'Complaint removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/complaints/:id/comments
// @desc    Add comment to complaint
// @access  Private
router.post('/:id/comments', bothAuth, [
  body('text').notEmpty().withMessage('Comment text is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    const author = req.user ? req.user.id : (req.admin ? req.admin.id : null);
    const comment = {
      author,
      text: req.body.text
    };

    complaint.comments.push(comment);
    await complaint.save();

    // Create notification for comment
    const notification = new Notification({
      title: 'New Comment',
      message: `${req.user.firstName} ${req.user.lastName} commented on your complaint "${complaint.title}"`,
      type: 'info',
      recipient: complaint.submittedBy,
      relatedComplaint: complaint._id
    });
    await notification.save();

    res.json(complaint);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
