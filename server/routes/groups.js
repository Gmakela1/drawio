const express = require('express');
const router = express.Router({ mergeParams: true });
const fm = require('../lib/file-manager');
const { parseModel, serializeModel, generateId } = require('../lib/xml-builder');

function getModel(name) { return parseModel(fm.readDiagram(name)); }
function saveModel(name, model) { fm.writeDiagram(name, serializeModel(model)); }

// POST — create a group
router.post('/', (req, res) => {
    try {
        const { name } = req.params;
        const { children, label } = req.body;
        const model = getModel(name);
        const groupId = generateId('group');
        model.cells[groupId] = {
            id: groupId, parent: '1', vertex: true,
            value: label || '', style: 'group;container=1;collapsible=0;',
            geometry: { x: 0, y: 0, width: 0, height: 0 }
        };
        if (children && Array.isArray(children)) {
            for (const childId of children) {
                if (model.cells[childId]) model.cells[childId].parent = groupId;
            }
        }
        saveModel(name, model);
        res.json({ success: true, data: { id: groupId, children } });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// POST /:id/add — add child to group
router.post('/:id/add', (req, res) => {
    try {
        const { name, id } = req.params;
        const { childId } = req.body;
        const model = getModel(name);
        if (!model.cells[id]) return res.status(404).json({ success: false, error: 'Group not found' });
        if (!model.cells[childId]) return res.status(404).json({ success: false, error: 'Child not found' });
        model.cells[childId].parent = id;
        saveModel(name, model);
        res.json({ success: true, data: { groupId: id, childId } });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// POST /:id/remove — remove child from group
router.post('/:id/remove', (req, res) => {
    try {
        const { name, id } = req.params;
        const { childId } = req.body;
        const model = getModel(name);
        if (!model.cells[childId]) return res.status(404).json({ success: false, error: 'Child not found' });
        model.cells[childId].parent = '1';
        saveModel(name, model);
        res.json({ success: true, data: { groupId: id, childId } });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// DELETE /:id — ungroup
router.delete('/:id', (req, res) => {
    try {
        const { name, id } = req.params;
        const model = getModel(name);
        if (!model.cells[id]) return res.status(404).json({ success: false, error: 'Group not found' });
        const children = Object.values(model.cells).filter(c => c.parent === id);
        for (const child of children) child.parent = '1';
        delete model.cells[id];
        saveModel(name, model);
        res.json({ success: true, data: { id, ungrouped: children.length } });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

module.exports = router;