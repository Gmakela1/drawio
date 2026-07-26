# CircuitDiagram Component Converter — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a converter that reads circuitdiagram XML components and outputs drawio stencil libraries organized by EE category.

**Architecture:** Single converter module (`server/lib/component-converter.js`) that takes a source directory of circuitdiagram XML files, parses them, maps render elements to drawio mxCells, and writes organized stencil library `.xml` files to `e-ai-designs/stencils/`.

**Tech Stack:** Node.js 18+, built-in fs/path, regex-based XML parsing, drawio stencil XML format

## Global Constraints

- No new npm dependencies — use only Node.js built-ins
- All stencil output goes to `e-ai-designs/stencils/`
- Source components cloned to `server/lib/circuitdiagram-components/`
- Each stencil library is a valid drawio `.xml` file loadable via the browser

---

### Task 1: Clone Source Repo & Understand All Component Formats

**Files:**
- Create: `server/lib/circuitdiagram-components/` (cloned repo)

**Interfaces:**
- Consumes: None
- Produces: Local copy of circuitdiagram/components accessible at `server/lib/circuitdiagram-components/`

- [ ] **Step 1: Clone the source repo**

```bash
cd ~/vscode/drawio/server/lib
git clone https://github.com/circuitdiagram/components.git circuitdiagram-components
```

- [ ] **Step 2: Inventory all component files**

```bash
find circuitdiagram-components -name "*.xml" | sort > /tmp/component-list.txt
wc -l /tmp/component-list.txt
```

- [ ] **Step 3: Sample 5 diverse components and verify understanding of their XML**

Read one from each major pattern type: resistor (complex, many configs), fuse (simple), arduino_uno (large IC), motor (output), 7_segment (custom shapes). Verify the parsing approach works for all.

- [ ] **Step 4: Commit the cloned repo**

```bash
git add server/lib/circuitdiagram-components/
git commit -m "feat: clone circuitdiagram/components source repo"
```

---

### Task 2: Build XML Parser Module

**Files:**
- Create: `server/lib/component-converter.js`

**Interfaces:**
- Consumes: `circuitdiagram-components/` directory
- Produces: `parseComponentXml(xmlString)` → `{ name, properties, configurations, connections, renderElements }`

- [ ] **Step 1: Write the parseComponentXml function**

```javascript
/**
 * Parse a circuitdiagram component XML into a structured object.
 */
function parseComponentXml(xmlString) {
    // Extract declaration metadata
    const nameMatch = xmlString.match(/<meta name="name" value="([^"]*)"/);
    const name = nameMatch ? nameMatch[1] : 'Unknown';

    // Extract properties
    const properties = [];
    const propRegex = /<property name="([^"]*)" type="([^"]*)" default="([^"]*)"[^>]*display="([^"]*)"/g;
    let propMatch;
    while ((propMatch = propRegex.exec(xmlString)) !== null) {
        properties.push({
            name: propMatch[1], type: propMatch[2], 
            default: propMatch[3], display: propMatch[4]
        });
    }

    // Extract configurations (variant presets)
    const configurations = [];
    const configRegex = /<configuration name="([^"]*)" value="([^"]*)"(?: implements="([^"]*)")?/g;
    let configMatch;
    while ((configMatch = configRegex.exec(xmlString)) !== null) {
        configurations.push({
            name: configMatch[1], value: configMatch[2],
            implements: configMatch[3] || null
        });
    }

    // Extract connections (pins)
    const connections = [];
    const connRegex = /<connection(?:[^>]*)name="([^"]*)"[^>]*start="([^"]*)"[^>]*end="([^"]*)"(?:[^>]*edge="([^"]*)")?/g;
    let connMatch;
    while ((connMatch = connRegex.exec(xmlString)) !== null) {
        connections.push({
            name: connMatch[1], start: connMatch[2],
            end: connMatch[3], edge: connMatch[4] || 'start'
        });
    }

    // Extract render elements (between <render> and </render>)
    const renderMatch = xmlString.match(/<render[^>]*>([\s\S]*?)<\/render>/);
    const renderXml = renderMatch ? renderMatch[1] : '';

    return { name, properties, configurations, connections, renderXml };
}
```

- [ ] **Step 2: Test parser on a single component**

```bash
cd ~/vscode/drawio/server
node -e "
const fs = require('fs');
const { parseComponentXml } = require('./lib/component-converter');
const xml = fs.readFileSync('./lib/circuitdiagram-components/common/fuse/fuse.xml', 'utf8');
const parsed = parseComponentXml(xml);
console.log('Name:', parsed.name);
console.log('Properties:', parsed.properties.length);
console.log('Configurations:', parsed.configurations.length);
console.log('Connections:', parsed.connections.length);
console.log('Has render:', !!parsed.renderXml);
"
```

Expected output: Name: Fuse, Properties: 1, Configurations: 0, Connections: 2 or 4, Has render: true

- [ ] **Step 3: Test on a complex component (resistor with multiple configs)**

Same test on `common/resistor/resistor.xml`. Expected: 5+ properties, 10 configurations, 2-3 connections.

- [ ] **Step 4: Commit**

```bash
git add server/lib/component-converter.js
git commit -m "feat: add circuitdiagram XML parser"
```

---

### Task 3: Add Render Element Parsing & Coordinate Resolution

**Files:**
- Modify: `server/lib/component-converter.js`

**Interfaces:**
- Produces: `parseRenderElements(renderXml)` → `[{type, x, y, width, height, text, ...}]`
- Produces: `resolveCoords(elements, connections)` → normalized elements with absolute coordinates

- [ ] **Step 1: Write parseRenderElements function**

Parse the render XML into structured elements:

```javascript
function parseRenderElements(renderXml) {
    const elements = [];
    
    // Parse <rect> elements
    const rectRegex = /<rect[^>]*>/g;
    let match;
    while ((match = rectRegex.exec(renderXml)) !== null) {
        const attrs = parseAttributes(match[0]);
        elements.push({
            type: 'rect',
            x: attrs.x, y: attrs.y,
            width: attrs.width || '40',
            height: attrs.height || '16',
            location: attrs.location || null // "location" is alternative to x/y/width/height
        });
    }
    
    // Parse <line> elements
    const lineRegex = /<line[^>]*\/>/g;
    while ((match = lineRegex.exec(renderXml)) !== null) {
        const attrs = parseAttributes(match[0]);
        elements.push({
            type: 'line',
            start: attrs.start, end: attrs.end
        });
    }
    
    // Parse <ellipse> elements
    const ellipseRegex = /<ellipse[^>]*\/>/g;
    while ((match = ellipseRegex.exec(renderXml)) !== null) {
        const attrs = parseAttributes(match[0]);
        elements.push({
            type: 'ellipse',
            x: attrs.x || attrs.centre || '_Middle',
            y: attrs.y || attrs.centre || '_Middle',
            rx: attrs.rx || '12', ry: attrs.ry || '12'
        });
    }
    
    // Parse <path> elements
    const pathRegex = /<path[^>]*\/>/g;
    while ((match = pathRegex.exec(renderXml)) !== null) {
        const attrs = parseAttributes(match[0]);
        elements.push({
            type: 'path',
            start: attrs.start || '_Middle',
            data: attrs.data || ''
        });
    }
    
    // Parse <text> elements
    const textRegex = /<text[^>]*\/>/g;
    while ((match = textRegex.exec(renderXml)) !== null) {
        const attrs = parseAttributes(match[0]);
        elements.push({
            type: 'text',
            x: attrs.x || '_Middle', y: attrs.y || '_Middle',
            value: attrs.value || '', align: attrs.align || 'CentreCentre',
            size: attrs.size || 'normal'
        });
    }
    
    return elements;
}

function parseAttributes(elementTag) {
    const attrs = {};
    const regex = /(\w+)="([^"]*)"/g;
    let match;
    while ((match = regex.exec(elementTag)) !== null) {
        attrs[match[1]] = match[2];
    }
    return attrs;
}
```

- [ ] **Step 2: Write coordinate resolution**

```javascript
// Default component size (will be computed dynamically later)
const DEFAULT_W = 160;
const DEFAULT_H = 160;

function resolveCoordinate(coordStr, isX) {
    // Anchor points
    const anchors = {
        '_Start': isX ? 0 : 0,
        '_End': isX ? DEFAULT_W : DEFAULT_H,
        '_Middle': isX ? DEFAULT_W / 2 : DEFAULT_H / 2,
        'Start': 0,
        'End': isX ? DEFAULT_W : DEFAULT_H,
        'Middle': isX ? DEFAULT_W / 2 : DEFAULT_H / 2,
    };
    
    // Handle expressions like "_Middle-20x", "_Start+10y"
    let result = null;
    for (const [key, val] of Object.entries(anchors)) {
        const regex = new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '([+-]\\d+)[xy]');
        const match = coordStr.match(regex);
        if (match) {
            result = val + parseInt(match[1]);
        }
    }
    if (result === null) {
        // Try numeric
        const num = parseFloat(coordStr);
        if (!isNaN(num)) result = num;
        else result = 0;
    }
    return Math.round(result);
}
```

- [ ] **Step 3: Test coordinate resolution**

```bash
node -e "
const { resolveCoordinate } = require('./lib/component-converter');
console.log('_Middle (x):', resolveCoordinate('_Middle', true));      // 80
console.log('_Middle-20x:', resolveCoordinate('_Middle-20x', true));  // 60
console.log('_Start+10y:', resolveCoordinate('_Start+10y', false));   // 10
"
```

- [ ] **Step 4: Commit**

---

### Task 4: Build drawio mxCell Output Generator

**Files:**
- Modify: `server/lib/component-converter.js`

**Interfaces:**
- Produces: `generateDrawioCells(component)` → `[{mxCell XML string}, ...]`
- Produces: `buildStencilEntry(component)` → `{xml: compressedXML, w: number, h: number, title: string}`

- [ ] **Step 1: Write the cell generator**

```javascript
function generateDrawioCells(renderElements, connections, name) {
    const cells = [];
    let idCounter = 2; // 0 and 1 are reserved for root and layer
    
    // Add connection pins (small 4x4 squares at connection endpoints)
    for (const conn of connections) {
        const endX = resolveCoordinate(conn.end.replace(/[xy]$/, ''), conn.end.endsWith('x'));
        const endY = resolveCoordinate(conn.end.replace(/[xy]$/, ''), conn.end.endsWith('y'));
        cells.push({
            id: String(idCounter++), parent: '1', vertex: true,
            value: conn.name,
            style: 'fillColor=#00CC00;strokeColor=#000000;fontSize=8;align=center;',
            geometry: { x: endX - 4, y: endY - 4, width: 8, height: 8 }
        });
    }
    
    // Convert each render element to a drawio shape
    for (const elem of renderElements) {
        switch (elem.type) {
            case 'rect': {
                let x, y, w, h;
                if (elem.location) {
                    // Parse "location" format: "_Middle-8x-20y" means x offset -8, y offset -20
                    // But we need to approximate - use Middle as origin
                    x = resolveCoordinate(elem.location, true) || DEFAULT_W/2;
                    y = resolveCoordinate(elem.location, false) || DEFAULT_H/2;
                    w = parseInt(elem.width) || 40;
                    h = parseInt(elem.height) || 16;
                } else {
                    x = resolveCoordinate(elem.x, true);
                    y = resolveCoordinate(elem.y, false);
                    w = parseInt(elem.width) || 40;
                    h = parseInt(elem.height) || 16;
                }
                cells.push({
                    id: String(idCounter++), parent: '1', vertex: true,
                    style: 'fillColor=none;strokeColor=#000000;',
                    geometry: { x, y, width: w, height: h }
                });
                break;
            }
            case 'line': {
                const sx = resolveCoordinate(elem.start.replace(/[xy]$/, ''), elem.start.endsWith('x'));
                const sy = resolveCoordinate(elem.start.replace(/[xy]$/, ''), elem.start.endsWith('y'));
                const ex = resolveCoordinate(elem.end.replace(/[xy]$/, ''), elem.end.endsWith('x'));
                const ey = resolveCoordinate(elem.end.replace(/[xy]$/, ''), elem.end.endsWith('y'));
                // Represent line as a narrow rectangle or edge
                const midX = (sx + ex) / 2;
                const midY = (sy + ey) / 2;
                const lineWidth = Math.abs(ex - sx) || 2;
                const lineHeight = Math.abs(ey - sy) || 2;
                cells.push({
                    id: String(idCounter++), parent: '1', vertex: true,
                    style: 'fillColor=#000000;strokeColor=none;',
                    geometry: { 
                        x: Math.min(sx, ex), y: Math.min(sy, ey),
                        width: Math.max(lineWidth, 2), height: Math.max(lineHeight, 2)
                    }
                });
                break;
            }
            case 'ellipse': {
                const cx = resolveCoordinate(elem.x, true);
                const cy = resolveCoordinate(elem.y, false);
                const rx = parseInt(elem.rx) || 12;
                const ry = parseInt(elem.ry) || 12;
                cells.push({
                    id: String(idCounter++), parent: '1', vertex: true,
                    style: 'ellipse;fillColor=none;strokeColor=#000000;',
                    geometry: { x: cx - rx, y: cy - ry, width: rx * 2, height: ry * 2 }
                });
                break;
            }
            case 'text': {
                const tx = resolveCoordinate(elem.x, true);
                const ty = resolveCoordinate(elem.y, false);
                cells.push({
                    id: String(idCounter++), parent: '1', vertex: true,
                    value: elem.value || '?',
                    style: 'fillColor=none;strokeColor=none;fontSize=12;align=center;',
                    geometry: { x: tx - 30, y: ty - 8, width: 60, height: 16 }
                });
                break;
            }
            case 'path': {
                // Approximate paths as a placeholder rectangle
                const sx = resolveCoordinate(elem.start, true);
                const sy = resolveCoordinate(elem.start, false);
                cells.push({
                    id: String(idCounter++), parent: '1', vertex: true,
                    value: '[path]',
                    style: 'fillColor=#EEEEEE;strokeColor=#000000;fontSize=8;dashed=1;',
                    geometry: { x: sx - 15, y: sy - 15, width: 30, height: 30 }
                });
                break;
            }
        }
    }
    
    return cells;
}
```

- [ ] **Step 2: Write the stencil entry builder**

```javascript
function buildStencilEntry(cells, componentName, width, height) {
    // Build mxGraphModel XML
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<mxGraphModel>\n  <root>\n';
    xml += '    <mxCell id="0"/>\n';
    xml += '    <mxCell id="1" parent="0"/>\n';
    for (const cell of cells) {
        xml += `    <mxCell id="${cell.id}" parent="${cell.parent}" vertex="1"`;
        if (cell.value) xml += ` value="${escapeXml(cell.value)}"`;
        xml += ` style="${escapeXml(cell.style)}"`;
        if (cell.geometry) {
            xml += '>\n      <mxGeometry';
            if (cell.geometry.x !== undefined) xml += ` x="${cell.geometry.x}"`;
            if (cell.geometry.y !== undefined) xml += ` y="${cell.geometry.y}"`;
            if (cell.geometry.width !== undefined) xml += ` width="${cell.geometry.width}"`;
            if (cell.geometry.height !== undefined) xml += ` height="${cell.geometry.height}"`;
            xml += ' as="geometry"/>\n    </mxCell>\n';
        } else {
            xml += '/>\n';
        }
    }
    xml += '  </root>\n</mxGraphModel>';
    
    return {
        xml: xml,
        w: width || DEFAULT_W,
        h: height || DEFAULT_H,
        title: componentName
    };
}
```

- [ ] **Step 4: Commit**

---

### Task 5: Build Batch Converter & Stencil File Writer

**Files:**
- Modify: `server/lib/component-converter.js`

**Interfaces:**
- Produces: `convertAll(sourceDir, outputDir)` — reads all XML files, categorizes them, writes 8 stencil files
- Produces: `categorizeComponent(name)` → one of 'passive', 'semiconductor', 'switching', 'power', 'ic', 'output', 'logic', 'sensors'

- [ ] **Step 1: Create the categorization map**

```javascript
const CATEGORY_MAP = {
    'resistor': 'passive', 'capacitor': 'passive', 'inductor': 'passive',
    'transformer': 'passive', 'crystal': 'passive', 'wire': 'passive',
    'bus': 'passive', 'connector': 'passive', 'antenna': 'passive',
    'external_connection': 'passive', 'label': 'passive',
    
    'diode': 'semiconductor', 'alternative_diode': 'semiconductor',
    'standard_diode': 'semiconductor', 'transistor': 'semiconductor',
    'thyristor': 'semiconductor', 'triac': 'semiconductor',
    'op_amp': 'semiconductor', 'phototransistor': 'semiconductor',
    
    'fuse': 'switching', 'switch': 'switching', 'relay': 'switching',
    'relay_2': 'switching', 'multi_pole_switch': 'switching',
    'solid_state_relay': 'switching', 'reed_switch': 'switching',
    
    'source': 'power', 'ac_dc_converter': 'power', 'generator': 'power',
    'bridge_rectifier': 'power', 'voltage_regulator': 'power',
    'meter': 'power', 'alternative_ground': 'power',
    
    'motor': 'output', 'bipolar_stepper_motor': 'output',
    'stepper_motor': 'output', 'servo_motor': 'output',
    'speaker': 'output', 'buzzer': 'output', 'lamp': 'output',
    'heater': 'output', 'pump': 'output', '7_segment_display': 'output',
    'hd44780': 'output', 'lcd_driver': 'output', 'rgb_led': 'output',
    
    'logic_gate': 'logic', 'logic_gate_3_input': 'logic',
    'd_flip_flop': 'logic', 'jk_flip_flop': 'logic', 't_flip_flop': 'logic',
    'multiplexer': 'logic', 'demultiplexer': 'logic', 'counter_4_bit': 'logic',
    'adder': 'logic', 'digital_buffer': 'logic',
    
    'hall_effect_sensor': 'sensors', 'microphone': 'sensors',
    'photovoltaic_cell': 'sensors', 'ir_sensor': 'sensors',
    'ultrasonic_distance_sensor': 'sensors', 'real_time_clock': 'sensors',
    'signal_generator': 'sensors', '555_oscillator': 'sensors',
    'oscilloscope': 'sensors',
    
    // IC/dev board components go to ic
    'arduino_uno': 'ic', 'arduino_mega_2560': 'ic', 'arduino_nano': 'ic',
    'arduino_nano_v2': 'ic', 'arduino_nano_v3': 'ic', 'arduino_leonardo': 'ic',
    'esp32': 'ic', 'node_mcu': 'ic', 'raspberry_pi': 'ic',
    'raspberry_pi_pico': 'ic', 'raspberry_pi_b': 'ic', 'raspberry_pi_a_b_2_3_zero': 'ic',
    'atmega328': 'ic', 'qt_py': 'ic', 'bcd_decoder': 'ic',
    '4017_decade_counter': 'ic', '4510_bcd_counter': 'ic',
    'microcontroller': 'ic', 'integrated_circuit': 'ic',
    'integrated_circuit_2': 'ic', 'integrated_circuit_3': 'ic',
    'integrated_circuit_4x25': 'ic', 'vs1053': 'ic',
    'dfrobot_dfplayer_mini': 'ic',
};

function categorizeComponent(name) {
    return CATEGORY_MAP[name] || 'misc';
}
```

- [ ] **Step 2: Write the batch converter**

```javascript
function convertAll(sourceDir, outputDir) {
    const libraries = {};
    
    // Walk all XML files
    const files = findXmlFiles(sourceDir);
    for (const file of files) {
        const xml = fs.readFileSync(file, 'utf8');
        const parsed = parseComponentXml(xml);
        const renderElements = parseRenderElements(parsed.renderXml);
        const cells = generateDrawioCells(renderElements, parsed.connections, parsed.name);
        const category = categorizeComponent(parsed.name.toLowerCase());
        
        const entry = buildStencilEntry(cells, parsed.name, DEFAULT_W, DEFAULT_H);
        if (!libraries[category]) libraries[category] = [];
        libraries[category].push(entry);
    }
    
    // Write stencil library files
    const LIB_NAMES = {
        passive: 'eai-passive', semiconductor: 'eai-semiconductor',
        switching: 'eai-switching', power: 'eai-power',
        ic: 'eai-ic', output: 'eai-output',
        logic: 'eai-logic', sensors: 'eai-sensors',
        misc: 'eai-misc'
    };
    
    for (const [category, entries] of Object.entries(libraries)) {
        const libName = LIB_NAMES[category] || 'eai-other';
        const libraryXml = buildStencilLibrary(entries, libName);
        const outPath = path.join(outputDir, `${libName}.xml`);
        fs.writeFileSync(outPath, libraryXml, 'utf8');
    }
}

function buildStencilLibrary(entries, name) {
    return `<mxlibrary>\n${JSON.stringify(entries, null, 2)}\n</mxlibrary>`;
}

function findXmlFiles(dir) {
    const results = [];
    function walk(d) {
        const items = fs.readdirSync(d, { withFileTypes: true });
        for (const item of items) {
            const fullPath = path.join(d, item.name);
            if (item.isDirectory()) {
                // Skip .git, output, common subdirs that aren't component dirs
                if (!item.name.startsWith('.') && item.name !== 'output') {
                    walk(fullPath);
                }
            } else if (item.name.endsWith('.xml') && !item.name.startsWith('.')) {
                results.push(fullPath);
            }
        }
    }
    walk(dir);
    return results;
}
```

- [ ] **Step 3: Run the batch converter**

```bash
cd ~/vscode/drawio/server
node -e "
const { convertAll } = require('./lib/component-converter');
convertAll('./lib/circuitdiagram-components', '../../../e-ai-designs/stencils');
console.log('Done!');
"
```

- [ ] **Step 5: Commit**

---

### Task 6: Test Components in Browser

**Files:**
- Create: `e-ai-designs/diagrams/validation-all.drawio`

- [ ] **Step 1: Restart the server to pick up new stencil files**

```bash
npx kill-port 3000
cd ~/vscode/drawio/server && node server.js &
sleep 2
```

- [ ] **Step 2: Verify stencil files are served**

```bash
curl http://localhost:3000/api/stencils
```

Expected: list includes `eai-passive.xml`, `eai-semiconductor.xml`, etc.

- [ ] **Step 3: Open browser and manually load a stencil library**

Open http://localhost:3000/editor
In the drawio editor, go to File → Open Library → browse to one of the stencil files

- [ ] **Step 4: Create a validation diagram with sample components**

Place 3-5 components from each library, visually inspect for rendering quality

- [ ] **Step 5: Document which components need hand-tuning**

Mark components that don't render correctly (paths rendered as placeholders, missing detail, wrong proportions)

- [ ] **Step 6: Commit**

---

### Task 7: Hand-Tune Problem Components

**Files:**
- Modify: `e-ai-designs/stencils/eai-*.xml` (selected entries)
- Modify: `server/lib/component-converter.js` (fix converter for recurring patterns)

- [ ] **Step 1: Fix path-rendered components (most common issue)**

For components that got `[path]` placeholder, hand-craft the mxCell XML using drawio's native shape types or custom path data

- [ ] **Step 2: Fix proportion/scaling issues**

Adjust DEFAULT_W/DEFAULT_H based on component type

- [ ] **Step 3: Fix pin positions**

Ensure connection pins are at visually sensible positions

- [ ] **Step 4: Re-run batch converter for any fixed patterns**

```bash
node -e "const { convertAll } = require('./lib/component-converter'); convertAll(...)"
```

- [ ] **Step 5: Commit**

```
git add e-ai-designs/stencils/ server/lib/component-converter.js
git commit -m "fix: hand-tune component stencils for rendering quality"
```
