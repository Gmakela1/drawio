const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const STENCILS_DIR = path.join(__dirname, '..', '..', 'stencils', 'custom');

function ensureDir() {
    if (!fs.existsSync(STENCILS_DIR)) fs.mkdirSync(STENCILS_DIR, { recursive: true });
}

// GET /api/stencils — list libraries
router.get('/', (req, res) => {
    try {
        ensureDir();
        const files = fs.readdirSync(STENCILS_DIR).filter(f => f.endsWith('.xml'));
        res.json({ success: true, data: files });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// POST /api/stencils — create library
router.post('/', (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ success: false, error: 'name is required' });
        const fileName = name.endsWith('.xml') ? name : name + '.xml';
        const filePath = path.join(STENCILS_DIR, fileName);
        if (fs.existsSync(filePath)) return res.status(400).json({ success: false, error: 'Already exists' });
        const xml = '<?xml version="1.0" encoding="UTF-8"?><shapes><shape name="' + name + '"/></shapes>';
        fs.writeFileSync(filePath, xml, 'utf8');
        res.json({ success: true, data: { name: fileName } });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// GET /api/stencils/:name — get library content
router.get('/:name', (req, res) => {
    try {
        ensureDir();
        const filePath = path.join(STENCILS_DIR, req.params.name);
        if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, error: 'Not found' });
        const xml = fs.readFileSync(filePath, 'utf8');
        res.json({ success: true, data: { name: req.params.name, xml } });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// PUT /api/stencils/:name — update library
router.put('/:name', (req, res) => {
    try {
        const filePath = path.join(STENCILS_DIR, req.params.name);
        fs.writeFileSync(filePath, req.body.xml, 'utf8');
        res.json({ success: true, data: { name: req.params.name } });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// DELETE /api/stencils/:name — delete library
router.delete('/:name', (req, res) => {
    try {
        const filePath = path.join(STENCILS_DIR, req.params.name);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        res.json({ success: true, data: { name: req.params.name } });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

module.exports = router;