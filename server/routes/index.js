const express = require('express');
const router = express.Router();
const fm = require('../lib/file-manager');

router.get('/health', (req, res) => {
    res.json({ success: true, data: { status: 'ok', version: '1.0.0' } });
});

// Diagram CRUD
router.use('/diagrams', require('./diagrams'));

// Stencil libraries
router.use('/stencils', require('./stencils'));

// SSE endpoint for all-file changes (global watcher)
router.get('/watch', (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });
    res.write('data: {"event":"connected"}\n\n');
    fm.watchAllDiagrams(res);
});

// SSE endpoint for per-file auto-refresh (legacy)
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