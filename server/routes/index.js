const express = require('express');
const router = express.Router();
const fm = require('../lib/file-manager');

router.get('/health', (req, res) => {
    res.json({ success: true, data: { status: 'ok', version: '1.0.0' } });
});

// Diagram CRUD
router.use('/diagrams', require('./diagrams'));

// SSE endpoint for auto-refresh
router.get('/watch/:name', (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });
    res.write('data: {"event":"connected"}\n\n');
    fm.watchDiagram(req.params.name, res);
});

module.exports = router;