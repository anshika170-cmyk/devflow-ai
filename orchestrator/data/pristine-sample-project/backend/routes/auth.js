const express = require('express');
const router = express.Router();

// POST /api/login
// --------------------------------------------------------------------
// BUG #1 (API response mismatch):
// The frontend (see frontend/src/api.js -> login()) reads `data.username`
// from the response body. This handler returns the field as `name`
// instead of `username`, so the frontend always shows "undefined".
// --------------------------------------------------------------------
router.post('/login', (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: 'username is required' });
  }

  // Intentional bug: key should be "username" to match frontend contract.
  res.json({
  name: username,
  token: 'demo-token-123'
});
});

module.exports = router;
