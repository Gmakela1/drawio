const express = require('express');
const router = express.Router({ mergeParams: true });
const fm = require('../lib/file-manager');
const { parseModel, serializeModel, generateId } = require('../lib/xml-builder');

function getModel(name) {
    return parseModel(fm.readDiagram(name));
}
function saveModel(name, model) {
    fm.writeDiagram(name, serializeModel(model));
}

// POST — add a shape
router.post('/', (req, res) => {
    try {
        const { name } = req.params;
        const { x, y, width, height, label, style } = req.body;
        const model = getModel(name);
        const id = generateId('shape');
        const styleStr = style ? Object.entries(style).map(([k,v]) => `${k}=${v}`).join(';') : '';
        model.cells[id] = {
            id, parent: '1', vertex: true,
            value: label || '', style: styleStr,
            geometry: { x, y, width, height }
        };
        saveModel(name, model);
        res.json({ success: true, data: { id, ...req.body } });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// PUT /:id — update shape properties
router.put('/:id', (req, res) => {
    try {
        const { name, id } = req.params;
        const model = getModel(name);
        if (!model.cells[id]) return res.status(404).json({ success: false, error: 'Not found' });
        const cell = model.cells[id];
        if (req.body.value !== undefined) cell.value = req.body.value;
        if (req.body.style !== undefined) {
            cell.style = Object.entries(req.body.style).map(([k,v]) => `${k}=${v}`).join(';');
        }
        if (req.body.x !== undefined) cell.geometry.x = req.body.x;
        if (req.body.y !== undefined) cell.geometry.y = req.body.y;
        if (req.body.width !== undefined) cell.geometry.width = req.body.width;
        if (req.body.height !== undefined) cell.geometry.height = req.body.height;
        saveModel(name, model);
        res.json({ success: true, data: { id, ...req.body } });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// DELETE /:id — remove a shape
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

// POST /:id/move
router.post('/:id/move', (req, res) => {
    try {
        const { name, id } = req.params;
        const { x, y } = req.body;
        const model = getModel(name);
        if (!model.cells[id]) return res.status(404).json({ success: false, error: 'Not found' });
        model.cells[id].geometry.x = x;
        model.cells[id].geometry.y = y;
        saveModel(name, model);
        res.json({ success: true, data: { id, x, y } });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// POST /:id/resize
router.post('/:id/resize', (req, res) => {
    try {
        const { name, id } = req.params;
        const { width, height } = req.body;
        const model = getModel(name);
        if (!model.cells[id]) return res.status(404).json({ success: false, error: 'Not found' });
        model.cells[id].geometry.width = width;
        model.cells[id].geometry.height = height;
        saveModel(name, model);
        res.json({ success: true, data: { id, width, height } });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// POST /:id/label
router.post('/:id/label', (req, res) => {
    try {
        const { name, id } = req.params;
        const { label } = req.body;
        const model = getModel(name);
        if (!model.cells[id]) return res.status(404).json({ success: false, error: 'Not found' });
        model.cells[id].value = label;
        saveModel(name, model);
        res.json({ success: true, data: { id, label } });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// POST /:id/fill
router.post('/:id/fill', (req, res) => {
    try {
        const { name, id } = req.params;
        const { color } = req.body;
        const model = getModel(name);
        if (!model.cells[id]) return res.status(404).json({ success: false, error: 'Not found' });
        const styles = parseStyleString(model.cells[id].style);
        styles.fillColor = color;
        model.cells[id].style = buildStyleString(styles);
        saveModel(name, model);
        res.json({ success: true, data: { id, fillColor: color } });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// POST /:id/stroke
router.post('/:id/stroke', (req, res) => {
    try {
        const { name, id } = req.params;
        const { color, width } = req.body;
        const model = getModel(name);
        if (!model.cells[id]) return res.status(404).json({ success: false, error: 'Not found' });
        const styles = parseStyleString(model.cells[id].style);
        if (color) styles.strokeColor = color;
        if (width !== undefined) styles.strokeWidth = width;
        model.cells[id].style = buildStyleString(styles);
        saveModel(name, model);
        res.json({ success: true, data: { id, strokeColor: color, strokeWidth: width } });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// POST /:id/text-style
router.post('/:id/text-style', (req, res) => {
    try {
        const { name, id } = req.params;
        const { color, size, bold, italic } = req.body;
        const model = getModel(name);
        if (!model.cells[id]) return res.status(404).json({ success: false, error: 'Not found' });
        const styles = parseStyleString(model.cells[id].style);
        if (color) styles.fontColor = color;
        if (size !== undefined) styles.fontSize = size;
        if (bold !== undefined) styles.fontStyle = bold ? '1' : '0';
        if (italic !== undefined) styles.fontStyle = italic ? '2' : '0';
        model.cells[id].style = buildStyleString(styles);
        saveModel(name, model);
        res.json({ success: true, data: { id, ...req.body } });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

function parseStyleString(style) {
    const result = {};
    if (!style) return result;
    style.split(';').forEach(pair => {
        const eq = pair.indexOf('=');
        if (eq > 0) result[pair.substring(0, eq)] = pair.substring(eq + 1);
    });
    return result;
}
function buildStyleString(styles) {
    return Object.entries(styles).filter(([_,v]) => v != null).map(([k,v]) => `${k}=${v}`).join(';');
}

module.exports = router;