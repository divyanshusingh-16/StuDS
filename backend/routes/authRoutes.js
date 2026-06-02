const express = require('express');
const router = express.Router();

router.post('/login', (req, res) => {
  const { passcode } = req.body;
  if (!passcode) {
    return res.status(400).json({ error: 'Passcode is required.' });
  }
  
  if (passcode === process.env.ADMIN_PASSWORD) {
    return res.status(200).json({ token: 'authenticated' });
  } else {
    return res.status(401).json({ error: 'Invalid passcode.' });
  }
});

module.exports = router;
