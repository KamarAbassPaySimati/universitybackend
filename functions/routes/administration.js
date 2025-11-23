const express = require('express');
const router = express.Router();

router.get('/reports', (req, res) => {
  res.json({ message: 'Administration reports endpoint' });
});

module.exports = router;