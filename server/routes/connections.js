const express = require('express');
const router = express.Router({ mergeParams: true });
const fm = require('../lib/file-manager');
const { parseModel, serializeModel, generateId } = require('../lib/xml-builder');

function getModel(name) { return parseModel(fm.readDiagram(name)); }
function saveModel(name, model) { fm.writeDiagram(name, serializeModel(model)); }

// POST — connect two shapes
router.post('/', (req, res) => {
    try {
        const { name } = req.params;
        const { from, to, label, style } = req.body;
        const model = getModel(name);
        const id = generateId('edge');
        if (!model.cells[from]) return res.status(400).json({ success: false, error: 'Source shape not found' });
        if (!model.cells[to]) return res.status(400).json({ success: false, error: 'Target shape not found' });
        const styleStr = style ? Object.entries(style).map(([k,v]) => `${k}=${v}`).join(';') : '';
        model.cells[id] = {
            id, parent: '1', edge: true,
            value: label || '',
            style: styleStr || 'edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;endArrow=none;startArrow=none;',
            source: from, target: to,
            geometry: { relative: true }
        };
        saveModel(name, model);
        res.json({ success: true, data: { id, from, to, label } });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// DELETE /:id — remove a connection
router.delete('/:id', (req, res) => {
    try {
        const { name, id } = req.params;
        const model = getModel(name);
        if (!model.cells[id]) return res.status(404).json({ success: false, error: 'Not found' });
        delete model.cells[id];
        saveModel(name, model);
        res.json({ success: true, data: { id } });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// PUT /:id — update connection label/style
router.put('/:id', (req, res) => {
    try {
        const { name, id } = req.params;
        const model = getModel(name);
        if (!model.cells[id]) return res.status(404).json({ success: false, error: 'Not found' });
        const cell = model.cells[id];
        if (req.body.label !== undefined) cell.value = req.body.label;
        if (req.body.style !== undefined) {
            cell.style = Object.entries(req.body.style).map(([k,v]) => `${k}=${v}`).join(';');
        }
        saveModel(name, model);
        res.json({ success: true, data: { id, ...req.body } });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

module.exports = router;