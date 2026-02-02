const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { ServerClient } = require('postmark');
const { body, validationResult } = require('express-validator');

const router = express.Router();

const postmarkClient = process.env.POSTMARK_SERVER_TOKEN ? new ServerClient(process.env.POSTMARK_SERVER_TOKEN) : null;

// @route   POST /api/password-reset/forgot-password
// @desc    Send password reset email
// @access  Public
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Please provide a valid email')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiry = resetTokenExpiry;
    await user.save();

    // Create reset URL
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    // Email content
    const html = `
      <h2>Password Reset Request</h2>
      <p>You have requested a password reset. Please click the link below to reset your password:</p>
      <a href="${resetUrl}" style="background-color: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px;">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you did not request this, please ignore this email.</p>
    `;

    if (!postmarkClient) {
      return res.status(500).json({ message: 'Email provider not configured' });
    }
    const from = process.env.POSTMARK_FROM;
    if (!from) {
      return res.status(500).json({ message: 'Email sender address not configured' });
    }
    try {
      await postmarkClient.sendEmail({
        From: from,
        To: email,
        Subject: 'Password Reset Request',
        HtmlBody: html
      });
    } catch (e) {
      return res.status(500).json({ message: e.message || 'Failed to send reset email' });
    }

    res.json({ message: 'Password reset email sent successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// @route   POST /api/password-reset/reset-password/:token
// @desc    Reset password with token
// @access  Public
router.post('/reset-password/:token', [
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
