const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

router.get('/user', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('name email');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error('Error fetching user data:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/user', auth, async (req, res) => {
  const userId = req.user.id;
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Name is required' });
  }

  try {
    const existing = await User.findOne({ name });
    
    if (existing && existing._id.toString() !== userId) {
      return res.status(409).json({ message: 'Username already taken' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name },
      { new: true, select: 'name email' }
    );

    res.json(updatedUser);
  } catch (err) {
    console.error('Error updating username:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;