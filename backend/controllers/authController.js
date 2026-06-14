const User = require('../models/User');
const generateToken = require('../utils/generateToken');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/signup
 * @access  Public
 */
const signup = async (req, res, next) => {
  const { username, email, password } = req.body;

  try {
    // 1. Controller validation
    if (!username || !username.trim()) {
      res.status(400);
      return next(new Error('Username is required'));
    }
    if (!email || !email.trim()) {
      res.status(400);
      return next(new Error('Email is required'));
    }
    if (!password || password.length < 6) {
      res.status(400);
      return next(new Error('Password must be at least 6 characters long'));
    }

    // 2. Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(409); // Conflict status
      return next(new Error('User already exists with this email address'));
    }

    // 3. Create user (pre-save hashes the password)
    const user = await User.create({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password,
    });

    if (user) {
      // 4. Send success response with token
      res.status(201).json({
        token: generateToken(user._id),
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
        },
      });
    } else {
      res.status(400);
      next(new Error('Invalid user data received'));
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    // 1. Controller validation
    if (!email || !email.trim()) {
      res.status(400);
      return next(new Error('Email is required'));
    }
    if (!password) {
      res.status(400);
      return next(new Error('Password is required'));
    }

    // 2. Find user in database
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      res.status(401);
      return next(new Error('Invalid email or password'));
    }

    // 3. Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401);
      return next(new Error('Invalid email or password'));
    }

    // 4. Send success response with token
    res.status(200).json({
      token: generateToken(user._id),
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  signup,
  login,
};
