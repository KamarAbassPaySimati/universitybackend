const express = require('express');
const router = express.Router();

router.post('/', (req, res) => {
  res.json({ message: 'File upload endpoint' });
});

module.exports = router;