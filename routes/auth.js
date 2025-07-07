const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

const User = require('../models/User');
const VerificationCode = require('../models/VerificationCode');
const sendVerificationEmail = require('../utils/sendEmail');

const router = express.Router();

const sendCodeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  message: { msg: 'Too many attempts. Try again in a minute.' },
});

router.post('/send-code', sendCodeLimiter, async (req, res) => {
  const email = req.body.email?.toLowerCase().trim();
  if (!email) return res.status(400).json({ msg: 'Email is required' });

  const code = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    await VerificationCode.deleteMany({ email });
    await VerificationCode.create({
      email,
      code,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });

    await sendVerificationEmail(email, code);

    return res.json({ msg: 'Verification code sent' });
  } catch (err) {
    console.error('Send code error:', err);
    return res.status(500).json({ msg: 'Email send failed', error: err.message });
  }
});

router.post('/verify-code', async (req, res) => {
  const email = req.body.email?.toLowerCase().trim();
  const code = req.body.code?.trim();

  if (!email || !code) return res.status(400).json({ msg: 'Email and code are required' });

  try {
    const record = await VerificationCode.findOne({ email, code });
    if (!record) return res.status(400).json({ msg: 'Invalid or expired code' });

    if (record.expiresAt < new Date()) {
      await VerificationCode.deleteMany({ email });
      return res.status(400).json({ msg: 'Verification code expired' });
    }

    await VerificationCode.deleteMany({ email });

    const user = await User.findOne({ email });
    if (user && !user.emailVerified) {
      user.emailVerified = true;
      await user.save();
    }

    return res.json({ msg: 'Email verified' });
  } catch (err) {
    console.error('Verify code error:', err);
    return res.status(500).json({ msg: 'Verification failed', error: err.message });
  }
});

router.post(
  '/register',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Email is not valid'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array().map((e) => e.msg) });
    }

    const name = req.body.name?.trim();
    const email = req.body.email?.toLowerCase().trim();
    const password = req.body.password?.trim();

    try {
      const activeCode = await VerificationCode.findOne({ email });
      if (activeCode) {
        return res.status(400).json({ errors: ['Email not verified. Please verify your email first.'] });
      }

      if (await User.findOne({ email })) {
        return res.status(409).json({ errors: ['Email already exists'] });
      }
      if (await User.findOne({ name })) {
        return res.status(409).json({ errors: ['Username already taken'] });
      }

      const user = new User({
        name,
        email,
        password,
        emailVerified: true,
      });

      await user.save();

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

      return res.status(201).json({
        user: { name: user.name, email: user.email },
        token,
      });
    } catch (err) {
      console.error('Register error:', err);
      return res.status(500).json({ errors: ['Server error'] });
    }
  }
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array().map((err) => err.msg) });
    }

    const email = req.body.email?.toLowerCase().trim();
    const password = req.body.password?.trim();

    console.log('Login attempt for email:', `"${email}"`);
    console.log('Entered password:', `"${password}"`);

    try {
      const user = await User.findOne({ email });
      if (!user) {
        console.log('User not found');
        return res.status(401).json({ errors: ['User does not exist'] });
      }

      console.log('User found:', user.email);
      console.log('Stored hashed password:', `"${user.password}"`);

      if (!user.password || !user.password.startsWith('$2')) {
        console.warn('Password is missing or not hashed properly in DB');
        return res.status(500).json({ errors: ['Server error: invalid password data'] });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      console.log('Password match:', isMatch);

      if (!isMatch) {
        return res.status(401).json({ errors: ['Incorrect password'] });
      }

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
      return res.json({ user: { name: user.name, email: user.email }, token });
    } catch (err) {
      console.error('Login error:', err);
      return res.status(500).json({ errors: ['Server error'] });
    }
  }
);

router.post('/dev-reset-password', async (req, res) => {
  const email = req.body.email?.toLowerCase().trim();
  const newPassword = req.body.newPassword?.trim();

  if (!email || !newPassword) return res.status(400).json({ msg: 'Missing fields' });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: 'User not found' });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.json({ msg: 'Password updated successfully' });
  } catch (err) {
    console.error('Password reset error:', err);
    return res.status(500).json({ msg: 'Failed to reset password' });
  }
});

module.exports = router;
