const jwt = require('jsonwebtoken');

/**
 * Generates a signed JWT token for the authenticated user
 * @param {string} userId - The user's MongoDB ObjectId
 * @returns {string} Signed JWT token
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '7d', // Enforces session validity limit
  });
};

module.exports = generateToken;
