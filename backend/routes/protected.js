const express = require('express');

const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// This route only works when a valid JWT is sent in the Authorization header.
router.get('/dashboard', authenticateToken, (req, res) => {
  res.json({
    message: 'Welcome to your protected dashboard.',
    user: req.user,
  });
});

module.exports = router;
