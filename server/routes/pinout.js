const express = require('express');
const router = express.Router({ mergeParams: true });
const fm = require('../lib/file-manager');
const { parseModel, serializeModel, generateId } = require('../lib/xml-builder');

function getModel(name) { return parseModel(fm.readDiagram(name)); }
function saveModel(name, model) { fm.writeDiagram(name, serializeModel(model)); }

const PIN_STYLES = {
    power:  { fillColor: '#FF0000', strokeColor: '#000', fontSize: 8, fontColor: '#FFF' },
    ground: { fillColor: '#000000', strokeColor: '#000', fontSize: 8, fontColor: '#FFF' },
    gpio:   { fillColor: '#00AA00', strokeColor: '#000', fontSize: 8, fontColor: '#FFF' },
    input:  { fillColor: '#0066FF', strokeColor: '#000', fontSize: 8, fontColor: '#FFF' },
    output: { fillColor: '#FF8800', strokeColor: '#000', fontSize: 8, fontColor: '#FFF' },
    analog: { fillColor: '#AA00FF', strokeColor: '#000', fontSize: 8, fontColor: '#FFF' }
};

// POST — create a microcontroller/IC with pinout
router.post('/', (req, res) => {
    try {
        const { name } = req.params;
        const { x, y, width, height, label, pins } = req.body;
        const model = getModel(name);
        const icId = generateId('ic');
        const style = 'rounded=1;whiteSpace=wrap;html=1;fillColor=#333333;fontColor=#FFFFFF;strokeColor=#000000;';
        model.cells[icId] = {
            id: icId, parent: '1', vertex: true, value: label || 'IC',
            style, geometry: { x, y, width, height }
        };
        const pinIds = [];
        if (pins && Array.isArray(pins)) {
            for (const pin of pins) {
                const pinId = generateId('pin');
                const pinStyle = PIN_STYLES[pin.type] || PIN_STYLES.gpio;
                const styleStr = Object.entries(pinStyle).map(([k,v]) => `${k}=${v}`).join(';');
                const sidePins = pins.filter(p => p.side === pin.side);
                const idx = sidePins.findIndex(p => p.index === pin.index);
                const spacing = sidePins.length > 1
                    ? ((pin.side === 'left' || pin.side === 'right' ? height : width) - 30) / (sidePins.length - 1)
                    : 0;
                const offset = 15;
                let pinX, pinY;
                switch (pin.side) {
                    case 'left':
                        pinX = x - 6; pinY = y + offset + idx * spacing - 6; break;
                    case 'right':
                        pinX = x + width - 6; pinY = y + offset + idx * spacing - 6; break;
                    case 'top':
                        pinX = x + offset + idx * spacing - 6; pinY = y - 6; break;
                    case 'bottom':
                        pinX = x + offset + idx * spacing - 6; pinY = y + height - 6; break;
                    default:
                        pinX = x; pinY = y;
                }
                model.cells[pinId] = {
                    id: pinId, parent: icId, vertex: true,
                    value: pin.label || '',
                    style: styleStr + ';align=center;',
                    geometry: { x: pinX, y: pinY, width: 12, height: 12 }
                };
                pinIds.push({ id: pinId, side: pin.side, index: pin.index, label: pin.label, type: pin.type });
            }
        }
        saveModel(name, model);
        res.json({ success: true, data: { id: icId, pins: pinIds } });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

module.exports = router;