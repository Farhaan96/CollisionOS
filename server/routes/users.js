const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json([{ id: 'tech-1', firstName: 'Tech', role: 'technician' }]);
});

router.get('/technicians', (req, res) => {
  res.json([{ id: 'tech-1', firstName: 'Tech', role: 'technician' }]);
});

module.exports = router;
