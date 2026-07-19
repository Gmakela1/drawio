const express = require('express');
const router = express.Router();
const fm = require('../lib/file-manager');

// GET /api/diagrams — list all diagrams
router.get('/', (req, res) => {
    try {
        const diagrams = fm.listDiagrams();
        res.json({ success: true, data: diagrams });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// POST /api/diagrams — create new diagram
router.post('/', (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ success: false, error: 'name is required' });
        const fullName = name.endsWith('.drawio') ? name : name + '.drawio';
        const xml = fm.createDiagram(fullName);
        res.json({ success: true, data: { name: fullName, xml } });
    } catch (e) {
        res.status(400).json({ success: false, error: e.message });
    }
});

// GET /api/diagrams/:name — get diagram XML
router.get('/:name', (req, res) => {
    try {
        const xml = fm.readDiagram(req.params.name);
        res.json({ success: true, data: { name: req.params.name, xml } });
    } catch (e) {
        res.status(404).json({ success: false, error: e.message });
    }
});

// PUT /api/diagrams/:name — overwrite diagram
router.put('/:name', (req, res) => {
    try {
        fm.writeDiagram(req.params.name, req.body.xml);
        res.json({ success: true, data: { name: req.params.name } });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// DELETE /api/diagrams/:name — delete diagram
router.delete('/:name', (req, res) => {
    try {
        fm.deleteDiagram(req.params.name);
        res.json({ success: true, data: { name: req.params.name } });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// GET /api/diagrams/:name/list — list all shapes
router.get('/:name/list', (req, res) => {
    try {
        const xml = fm.readDiagram(req.params.name);
        const { parseModel } = require('../lib/xml-builder');
        const model = parseModel(xml);
        const shapes = Object.values(model.cells).filter(c => c.vertex || c.edge);
        res.json({ success: true, data: shapes });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

module.exports = router;