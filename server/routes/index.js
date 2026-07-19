const express = require('express');
const router = express.Router();

router.get('/health', (req, res) => {
    res.json({ success: true, data: { status: 'ok', version: '1.0.0' } });
});

// Future: router.use('/diagrams', require('./diagrams'));

module.exports = router;