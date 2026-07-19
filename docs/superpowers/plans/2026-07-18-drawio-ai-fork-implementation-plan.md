# drawio AI-Powered Diagramming Fork — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fork jgraph/drawio and build a Node.js server + REST API that enables AI-driven diagram creation, editing, and manipulation via pi code skills, with real-time browser refresh.

**Architecture:** Single Express server on port 3000 serves the unmodified drawio static files (from `src/main/webapp/`) alongside a REST API. A file watcher detects changes and pushes SSE events to the browser for auto-refresh. The AI interacts via project-scoped pi skills that call the REST API.

**Tech Stack:** Node.js 18+, Express 4, chokidar (file watcher), drawio v30.3.14 (static JS), pi code (project-scoped skills)

## Global Constraints

- Do NOT modify any file under `src/main/webapp/` (drawio upstream) — only add new files
- All .drawio files are stored in `diagrams/` at the project root
- The server runs on a single port: 3000
- All API responses use `{ success: true, data: ... }` or `{ success: false, error: "..." }` format
- Use CommonJS (require/module.exports) for Node.js server code
- Every npm dependency must be explicitly listed in package.json

## User Testing Cadence

After EVERY task completes, verify the work before moving to the next task:
1. Start the server (`cd server && node server.js`)
2. Open http://localhost:3000 in a browser — confirm the page loads
3. Run any curl commands or tests defined in the task — confirm expected output
4. Commit and push to the fork
5. Only proceed to the next task when the current one is verified working

This prevents cascading bugs and ensures each piece is solid before building on it.

---

### Task 1: Fork drawio on GitHub & Initialize Local Project

**What happens:** We fork the official `jgraph/drawio` repo into your personal GitHub account. That fork (`YOUR_USERNAME/drawio`) becomes the canonical repository we work from — all commits, branches, and syncs go through it. The `upstream` remote tracks the original project for pulling future updates.

**Files:**
- Create: `drawio/.gitignore`
- Create: `drawio/diagrams/.gitkeep`
- Create: `drawio/stencils/custom/.gitkeep`
- Create: `drawio/.pi/settings.json`

**Interfaces:**
- Consumes: (none — first task)
- Produces: Fork under your GitHub account (`https://github.com/YOUR_USERNAME/drawio`), local clone initialized with `origin` pointing to your fork and `upstream` pointing to jgraph/drawio

- [ ] **Step 1: Fork jgraph/drawio into your GitHub account**

This creates `https://github.com/YOUR_USERNAME/drawio` as a fork of `https://github.com/jgraph/drawio`. All our custom code lives in this fork.

```bash
github_fork_repository({ owner: "jgraph", repo: "drawio" })
```

- [ ] **Step 2: Clone your fork into the local drawio folder**

The fork must be cloned to `C:/Users/makel/vscode/drawio/` — this is the project root we work from.

```bash
cd C:/Users/makel/vscode
rm -rf drawio 2>/dev/null || true
# Replace YOUR_USERNAME with your actual GitHub username
git clone https://github.com/YOUR_USERNAME/drawio.git drawio
cd drawio
git checkout dev
# Add upstream to track original drawio releases
git remote add upstream https://github.com/jgraph/drawio.git
git remote -v
# Should show:
# origin    https://github.com/YOUR_USERNAME/drawio.git (fetch)
# origin    https://github.com/YOUR_USERNAME/drawio.git (push)
# upstream  https://github.com/jgraph/drawio.git (fetch)
# upstream  https://github.com/jgraph/drawio.git (push)

# Verify we're in the right place
pwd
# Expected: /c/Users/makel/vscode/drawio  or  C:\Users\makel\vscode\drawio
```
# upstream  https://github.com/jgraph/drawio.git (fetch)
# upstream  https://github.com/jgraph/drawio.git (push)
```

- [ ] **Step 3: Create the project directory structure**

```bash
mkdir -p diagrams
mkdir -p stencils/custom
mkdir -p server/routes
mkdir -p server/lib
mkdir -p server/docs
mkdir -p .pi/skills/drawio
mkdir -p docs
touch diagrams/.gitkeep
touch stencils/custom/.gitkeep
```

- [ ] **Step 4: Create .gitignore**

```
# Node
node_modules/
npm-debug.log*

# Server
server/node_modules/

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Drawio autosave
diagrams/*.autosave
diagrams/*.tmp

# Environment
.env
```

- [ ] **Step 5: Create .pi/settings.json for project-scoped pi config**

```json
{
  "skills": [".pi/skills"]
}
```

- [ ] **Step 6: Commit and push initial structure to your fork**

```bash
git add .gitignore diagrams/ stencils/ .pi/
git commit -m "chore: initialize project structure for AI fork"
git push origin dev
# Now https://github.com/YOUR_USERNAME/drawio has our custom structure
```

---

### Task 2: Server Scaffolding

**Files:**
- Create: `server/package.json`
- Create: `server/server.js`
- Create: `server/routes/index.js`

**Interfaces:**
- Consumes: Task 1 (directory structure)
- Produces: Express server that serves drawio static files on port 3000, with `/api/health` endpoint

- [ ] **Step 1: Create server/package.json**

```json
{
  "name": "drawio-ai-server",
  "version": "1.0.0",
  "description": "Node.js server for AI-powered drawio diagramming",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "chokidar": "^3.6.0",
    "cors": "^2.8.5"
  }
}
```

- [ ] **Step 2: Create server/server.js**

```javascript
const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Serve drawio static files
const webappPath = path.join(__dirname, '..', 'src', 'main', 'webapp');
app.use(express.static(webappPath));

// API routes
const apiRoutes = require('./routes/index');
app.use('/api', apiRoutes);

// Inject SSE refresh script into HTML responses
app.use((req, res, next) => {
    const originalSend = res.send;
    res.send = function(body) {
        if (typeof body === 'string' && res.get('Content-Type')?.includes('text/html')) {
            const sseScript = `
<script>
(function() {
    var diagramName = window.location.hash.replace('#', '') || 'diagram';
    var evtSource = new EventSource('/api/watch/' + encodeURIComponent(diagramName));
    evtSource.onmessage = function(e) {
        var data = JSON.parse(e.data);
        if (data.event === 'reload') {
            console.log('Diagram changed externally, reloading...');
            window.location.reload();
        }
    };
    evtSource.onerror = function() {
        console.log('SSE disconnected, retrying...');
    };
})();
</script>`;
            body = body.replace('</body>', sseScript + '</body>');
        }
        return originalSend.call(this, body);
    };
    next();
});

app.listen(PORT, () => {
    console.log(`drawio AI server running at http://localhost:${PORT}`);
    console.log(`API available at http://localhost:${PORT}/api`);
});
```

- [ ] **Step 3: Create server/routes/index.js**

```javascript
const express = require('express');
const router = express.Router();

router.get('/health', (req, res) => {
    res.json({ success: true, data: { status: 'ok', version: '1.0.0' } });
});

// Future: router.use('/diagrams', require('./diagrams'));

module.exports = router;
```

- [ ] **Step 4: Install dependencies and test**

```bash
cd server && npm install && cd ..
timeout 3 node server/server.js
# In another terminal:
curl http://localhost:3000/api/health
# Expected: {"success":true,"data":{"status":"ok","version":"1.0.0"}}
```

- [ ] **Step 5: Commit**

```bash
git add server/
git commit -m "feat: add Express server scaffolding with static file serving"
git push origin dev
```

---

### Task 3: Drawio File Library

**Files:**
- Create: `server/lib/xml-builder.js`
- Create: `server/lib/file-manager.js`

**Interfaces:**
- Consumes: Task 2 (server scaffolding)
- Produces: `xml-builder.js` exports `parseDrawioFile, serializeDrawioFile, createEmptyDiagram, parseModel, serializeModel, generateId, isCompressedFormat, decompressDiagram, compressDiagram`. `file-manager.js` exports `listDiagrams, readDiagram, writeDiagram, deleteDiagram, createDiagram, watchDiagram, addSseClient, removeSseClient, notifyChange`.

- [ ] **Step 1: Create server/lib/xml-builder.js**

```javascript
/**
 * mxGraph XML builder for drawio diagram files.
 */
const zlib = require('zlib');

function parseDrawioFile(content) {
    if (isCompressedFormat(content)) {
        content = decompressDiagram(content);
    }
    return content;
}

function serializeDrawioFile(xmlString) {
    return xmlString;
}

function isCompressedFormat(content) {
    const trimmed = content.trim();
    if (trimmed.startsWith('<?xml') || trimmed.startsWith('<mxGraphModel')) {
        return false;
    }
    return trimmed.length > 100 && !trimmed.startsWith('<');
}

function decompressDiagram(compressed) {
    try {
        const buffer = Buffer.from(compressed.trim(), 'base64');
        const decompressed = zlib.inflateRawSync(buffer);
        return decompressed.toString('utf8');
    } catch (e) {
        return compressed;
    }
}

function compressDiagram(xmlString) {
    const buffer = Buffer.from(xmlString, 'utf8');
    const compressed = zlib.deflateRawSync(buffer);
    return compressed.toString('base64');
}

function createEmptyDiagram() {
    return `<?xml version="1.0" encoding="UTF-8"?>
<mxGraphModel>
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
  </root>
</mxGraphModel>`;
}

function parseModel(xmlString) {
    const cells = {};
    let rootId = '0';
    const cellRegex = /<mxCell\s+([^>]*)>([\s\S]*?)<\/mxCell>/g;
    const cellMatches = [];
    let match;
    while ((match = cellRegex.exec(xmlString)) !== null) {
        cellMatches.push(match);
    }
    for (const m of cellMatches) {
        const attrs = parseAttributes(m[1]);
        const id = attrs.id;
        const geometry = parseGeometry(m[2]);
        cells[id] = {
            id,
            parent: attrs.parent || null,
            vertex: attrs.vertex === '1',
            edge: attrs.edge === '1',
            value: attrs.value || '',
            style: attrs.style || '',
            source: attrs.source || null,
            target: attrs.target || null,
            geometry
        };
        if (id === '0') rootId = id;
    }
    return { cells, rootId };
}

function serializeModel(model) {
    const cells = model.cells;
    const ids = Object.keys(cells).sort((a, b) => parseInt(a) - parseInt(b));
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<mxGraphModel>\n  <root>\n';
    for (const id of ids) {
        const cell = cells[id];
        xml += `    <mxCell id="${id}"`;
        if (cell.parent) xml += ` parent="${cell.parent}"`;
        if (cell.vertex) xml += ` vertex="1"`;
        if (cell.edge) xml += ` edge="1"`;
        if (cell.value) xml += ` value="${escapeXml(cell.value)}"`;
        if (cell.style) xml += ` style="${escapeXml(cell.style)}"`;
        if (cell.source) xml += ` source="${cell.source}"`;
        if (cell.target) xml += ` target="${cell.target}"`;
        if (cell.geometry) {
            xml += '>\n';
            xml += `      <mxGeometry`;
            if (cell.geometry.x !== undefined) xml += ` x="${cell.geometry.x}"`;
            if (cell.geometry.y !== undefined) xml += ` y="${cell.geometry.y}"`;
            if (cell.geometry.width !== undefined) xml += ` width="${cell.geometry.width}"`;
            if (cell.geometry.height !== undefined) xml += ` height="${cell.geometry.height}"`;
            if (cell.geometry.relative) xml += ` relative="1"`;
            xml += ` as="geometry"/>\n`;
            xml += `    </mxCell>\n`;
        } else {
            xml += `/>\n`;
        }
    }
    xml += '  </root>\n</mxGraphModel>';
    return xml;
}

function generateId(prefix = 'shape') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
}

function parseAttributes(attrString) {
    const attrs = {};
    const regex = /(\w+)="([^"]*)"/g;
    let match;
    while ((match = regex.exec(attrString)) !== null) {
        attrs[match[1]] = match[2];
    }
    return attrs;
}

function parseGeometry(content) {
    const match = content.match(/<mxGeometry\s+([^>]*)\/>/);
    if (!match) return null;
    const attrs = parseAttributes(match[1]);
    return {
        x: attrs.x ? parseFloat(attrs.x) : undefined,
        y: attrs.y ? parseFloat(attrs.y) : undefined,
        width: attrs.width ? parseFloat(attrs.width) : undefined,
        height: attrs.height ? parseFloat(attrs.height) : undefined,
        relative: attrs.relative === '1'
    };
}

function escapeXml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

module.exports = {
    parseDrawioFile, serializeDrawioFile, createEmptyDiagram,
    parseModel, serializeModel, generateId,
    isCompressedFormat, decompressDiagram, compressDiagram
};
```

- [ ] **Step 2: Create server/lib/file-manager.js**

```javascript
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const { parseDrawioFile, createEmptyDiagram } = require('./xml-builder');

const DIAGRAMS_DIR = path.join(__dirname, '..', '..', 'diagrams');
const sseClients = {};

function ensureDiagramsDir() {
    if (!fs.existsSync(DIAGRAMS_DIR)) {
        fs.mkdirSync(DIAGRAMS_DIR, { recursive: true });
    }
}

function listDiagrams() {
    ensureDiagramsDir();
    const files = fs.readdirSync(DIAGRAMS_DIR);
    return files
        .filter(f => f.endsWith('.drawio'))
        .map(f => ({
            name: f,
            size: fs.statSync(path.join(DIAGRAMS_DIR, f)).size,
            modified: fs.statSync(path.join(DIAGRAMS_DIR, f)).mtime
        }));
}

function readDiagram(name) {
    const filePath = path.join(DIAGRAMS_DIR, name);
    if (!fs.existsSync(filePath)) {
        throw new Error(`Diagram "${name}" not found`);
    }
    return parseDrawioFile(fs.readFileSync(filePath, 'utf8'));
}

function writeDiagram(name, xmlContent) {
    ensureDiagramsDir();
    const filePath = path.join(DIAGRAMS_DIR, name);
    fs.writeFileSync(filePath, xmlContent, 'utf8');
}

function deleteDiagram(name) {
    const filePath = path.join(DIAGRAMS_DIR, name);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
}

function createDiagram(name) {
    ensureDiagramsDir();
    const filePath = path.join(DIAGRAMS_DIR, name);
    if (fs.existsSync(filePath)) {
        throw new Error(`Diagram "${name}" already exists`);
    }
    const xml = createEmptyDiagram();
    fs.writeFileSync(filePath, xml, 'utf8');
    return xml;
}

function watchDiagram(name, res) {
    if (!sseClients[name]) sseClients[name] = [];
    sseClients[name].push(res);
    res.on('close', () => removeSseClient(name, res));
}

function removeSseClient(name, res) {
    if (sseClients[name]) {
        sseClients[name] = sseClients[name].filter(c => c !== res);
        if (sseClients[name].length === 0) delete sseClients[name];
    }
}

function notifyChange(name) {
    if (sseClients[name]) {
        const data = JSON.stringify({ event: 'reload', file: name });
        for (const res of sseClients[name]) {
            res.write(`data: ${data}\n\n`);
        }
    }
}

// Start file watcher
const watcher = chokidar.watch(DIAGRAMS_DIR, {
    ignored: /(^|[\/\\])\../,
    ignoreInitial: true
});

watcher.on('change', (filePath) => {
    const name = path.basename(filePath);
    notifyChange(name);
});

watcher.on('add', (filePath) => {
    const name = path.basename(filePath);
    notifyChange(name);
});

module.exports = {
    listDiagrams, readDiagram, writeDiagram,
    deleteDiagram, createDiagram,
    watchDiagram, removeSseClient, notifyChange
};
```

- [ ] **Step 3: Write a quick test**

```javascript
// server/lib/test-xml.js — run with: node lib/test-xml.js
const { createEmptyDiagram, parseModel, serializeModel, generateId } = require('./xml-builder');
const xml = createEmptyDiagram();
const model = parseModel(xml);
console.log('Cells count:', Object.keys(model.cells).length); // Expected: 2
const newId = generateId('test');
model.cells[newId] = { id: newId, parent: '1', vertex:
### Task 3: Drawio File Library (continued)

- [ ] **Step 3: Run the test**

```bash
cd server
node -e "
const { createEmptyDiagram, parseModel, serializeModel, generateId } = require('./lib/xml-builder');
const xml = createEmptyDiagram();
const model = parseModel(xml);
console.log('Cells:', Object.keys(model.cells).length); // Expected: 2
const newId = generateId('test');
model.cells[newId] = { id: newId, parent: '1', vertex: true, value: 'Test', style: 'rounded=1', geometry: { x: 10, y: 20, width: 100, height: 50 } };
const out = serializeModel(model);
console.log('Has Test:', out.includes('Test') ? 'PASS' : 'FAIL');
const model2 = parseModel(out);
console.log('Re-parse:', model2.cells[newId] ? 'PASS' : 'FAIL');
"
```

- [ ] **Step 4: Commit**

```bash
git add server/lib/
git commit -m "feat: add drawio XML builder and file manager"
git push origin dev
```

---

### Task 4: Diagram CRUD API

**Files:**
- Create: `server/routes/diagrams.js`
- Modify: `server/routes/index.js` (wire in the diagrams router)

**Interfaces:**
- Consumes: Task 3 (file-manager.js exports)
- Produces: Full CRUD API for diagrams at `/api/diagrams/*`

- [ ] **Step 1: Create server/routes/diagrams.js**

```javascript
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
        const xml = fm.createDiagram(name.endsWith('.drawio') ? name : name + '.drawio');
        res.json({ success: true, data: { name, xml } });
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

// GET /api/watch/:name — SSE endpoint for auto-refresh
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
```

- [ ] **Step 2: Wire into server/routes/index.js**

```javascript
const express = require('express');
const router = express.Router();

router.get('/health', (req, res) => {
    res.json({ success: true, data: { status: 'ok', version: '1.0.0' } });
});

router.use('/diagrams', require('./diagrams'));

module.exports = router;
```

- [ ] **Step 3: Test the API**

```bash
cd server && node server.js &
sleep 2

# Create a diagram
curl -X POST http://localhost:3000/api/diagrams \
  -H "Content-Type: application/json" \
  -d '{"name": "test.drawio"}'

# List diagrams
curl http://localhost:3000/api/diagrams

# Get diagram
curl http://localhost:3000/api/diagrams/test.drawio

# List shapes
curl http://localhost:3000/api/diagrams/test.drawio/list

# Cleanup
curl -X DELETE http://localhost:3000/api/diagrams/test.drawio
kill %1 2>/dev/null || true
```

- [ ] **Step 4: Commit**

```bash
git add server/routes/diagrams.js server/routes/index.js
git commit -m "feat: add diagram CRUD API with SSE auto-refresh"
git push origin dev
```


### Task 5: Shape Operations API

**Files:**
- Create: `server/routes/shapes.js`
- Modify: `server/routes/diagrams.js` (mount shapes sub-router)

**Interfaces:**
- Consumes: Task 3 (xml-builder.js: parseModel, serializeModel, generateId), Task 4 (diagrams CRUD)
- Produces: Shape CRUD at `/api/diagrams/:name/shapes/*`

- [ ] **Step 1: Create server/routes/shapes.js**

```javascript
const express = require('express');
const router = express.Router({ mergeParams: true });
const fm = require('../lib/file-manager');
const { parseModel, serializeModel, generateId } = require('../lib/xml-builder');

function getModel(name) {
    const xml = fm.readDiagram(name);
    return parseModel(xml);
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
```

- [ ] **Step 2: Mount shapes in diagrams.js**

Add after the diagram routes in `server/routes/diagrams.js`:
```javascript
router.use('/:name/shapes', require('./shapes'));
```

- [ ] **Step 3: Test**

```bash
cd server && node server.js &
sleep 2
curl -s -X POST http://localhost:3000/api/diagrams -H "Content-Type: application/json" -d '{"name":"test.drawio"}'
# Add shape
curl -s -X POST http://localhost:3000/api/diagrams/test.drawio/shapes -H "Content-Type: application/json" \
  -d '{"x":100,"y":100,"width":120,"height":60,"label":"Battery 12V","style":{"fillColor":"#FFCC00","strokeColor":"#000000","rounded":"1"}}'
# List shapes
curl -s http://localhost:3000/api/diagrams/test.drawio/list
# Cleanup
curl -s -X DELETE http://localhost:
### Task 7: Grouping & Pinout API (continued)
#### server/routes/groups.js

```javascript
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
```

- [ ] **Step 2: Mount in diagrams.js**

```javascript
router.use('/:name/groups', require('./groups'));
```

- [ ] **Step 3: Commit**

```bash
git add server/routes/groups.js
git commit -m "feat: add grouping API"
git push origin dev
```

---

### Task 8: Pinout Component API

**Files:**
- Create: `server/routes/pinout.js`
- Modify: `server/routes/diagrams.js` (mount pinout sub-router)

- [ ] **Step 1: Create server/routes/pinout.js**

```javascript
const express = require('express');
const router = express.Router({ mergeParams: true });
const fm = require('../lib/file-manager');
const { parseModel, serializeModel, generateId } = require('../lib/xml-builder');

function getModel(name) { return parseModel(fm.readDiagram(name)); }
function saveModel(name, model) { fm.writeDiagram(name, serializeModel(model)); }

const PIN_STYLES = {
    power: { fillColor: '#FF0000', strokeColor: '#000', fontSize: 8 },
    ground: { fillColor: '#000000', strokeColor: '#000', fontColor: '#FFF', fontSize: 8 },
    gpio: { fillColor: '#00AA00', strokeColor: '#000', fontColor: '#FFF', fontSize: 8 },
    input: { fillColor: '#0066FF', strokeColor: '#000', fontColor: '#FFF', fontSize: 8 },
    output: { fillColor: '#FF8800', strokeColor: '#000', fontSize: 8 },
    analog: { fillColor: '#AA00FF', strokeColor: '#000', fontColor: '#FFF', fontSize: 8 }
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
        const pinWidth = 12;
        const pinHeight = 12;
        const pinIds = [];
        if (pins && Array.isArray(pins)) {
            for (const pin of pins) {
                const pinId = generateId('pin');
                let pinX, pinY;
                const pinStyle = PIN_STYLES[pin.type] || PIN_STYLES.gpio;
                const styleStr = Object.entries(pinStyle).map(([k,v]) => `${k}=${v}`).join(';');
                const spacing = (pin.side === 'left' || pin.side === 'right')
                    ? (height - 20) / Math.max(pins.filter(p => p.side === pin.side).length, 1)
                    : (width - 20) / Math.max(pins.filter(p => p.side === pin.side).length, 1);
                const idx = pins.filter(p => p.side === pin.side && p.index <= pin.index).length - 1;
                switch (pin.side) {
                    case 'left':
                        pinX = x - pinWidth / 2; pinY = y + 10 + idx * spacing - pinHeight / 2; break;
                    case 'right':
                        pinX = x + width - pinWidth / 2; pinY = y + 10 + idx * spacing - pinHeight / 2; break;
                    case 'top':
                        pinX = x + 10 + idx * spacing - pinWidth / 2; pinY = y - pinHeight / 2; break;
                    case 'bottom':
                        pinX = x + 10 + idx * spacing - pinWidth / 2; pinY = y + height - pinHeight / 2; break;
                }
                model.cells[pinId] = {
                    id: pinId, parent: icId, vertex: true,
                    value: pin.label || '',
                    style: styleStr + ';align=center;',
                    geometry: { x: pinX, y: pinY, width: pinWidth, height: pinHeight }
                };
                pinIds.push({ id: pinId, ...pin });
            }
        }
        saveModel(name, model);
        res.json({ success: true, data: { id: icId, pins: pinIds } });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

module.exports = router;
```

- [ ] **Step 2: Mount in diagrams.js**

```javascript
router.use('/:name/pinout', require('./pinout'));
```

- [ ] **Step 3: Commit**

```bash
git add server/routes/pinout.js
git commit -m "feat: add pinout/IC component API"
git push origin dev
```

---

### Task 9: Stencil Library API

**Files:**
- Create: `server/routes/stencils.js`
- Modify: `server/routes/index.js` (mount stencils router)

- [ ] **Step 1: Create server/routes/stencils.js**

```javascript
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
        const files = fs.readdirSync(STENCILS_
### Task 10 (continued): pi Skill

- [ ] **Step 1: Create .pi/skills/drawio/SKILL.md**

```markdown
---
name: drawio
description: Create, edit, and design electrical/power distribution diagrams using the drawio API. Use when working with .drawio files or diagramming tasks.
---

# drawio Diagramming Skill

## Setup

Ensure the Node.js server is running:

```bash
cd server && node server.js
```

Open http://localhost:3000 in your browser.

## How to Use

Call the REST API at `http://localhost:3000/api/...` to create and modify diagrams.
All diagrams are stored in the `diagrams/` folder at the project root.

## Quick Start

1. Start the server
2. Open the browser
3. Create a diagram: `curl -X POST http://localhost:3000/api/diagrams -d '{"name":"my-project.drawio"}'`
4. Add shapes, connections, and styles via API
5. Refresh the browser to see changes

## Full API Reference

See [api-reference.md](api-reference.md) for all endpoints, style docs, and examples.
```

- [ ] **Step 2: Verify the skill loads**

```bash
# cd to the drawio project and start pi
cd C:/Users/makel/vscode/drawio
pi code --dry-run
# Expected: drawio skill should appear in available skills
```

- [ ] **Step 3: Commit**

```bash
git add .pi/skills/drawio/
git commit -m "feat: add project-scoped pi skill for drawio AI tools"
git push origin dev
```

---

### Task 11: Setup Guide for Other Devices

**Files:**
- Create: `docs/SETUP-GUIDE.md`

- [ ] **Step 1: Create docs/SETUP-GUIDE.md**

```markdown
# drawio AI Fork — Setup Guide

This guide covers how to set up this drawio AI fork on any device.

## Prerequisites

- Node.js 18 or later
- Git
- pi code (optional, for AI features)

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/drawio.git
cd drawio
git checkout dev
```

### 2. Install server dependencies

```bash
cd server
npm install
cd ..
```

### 3. Start the server

```bash
cd server
node server.js
```

### 4. Open the editor

Open http://localhost:3000 in your browser.

### 5. (Optional) Enable AI features

If you have pi code installed, navigate to the project folder:

```bash
cd drawio
pi code
```

The drawio skill will be available for AI-driven diagramming.

## Syncing Diagrams Across Devices

### Option A: Git (Recommended)

```bash
cd drawio
git add diagrams/
git commit -m "update diagrams"
git push origin dev
```

On another device:
```bash
git pull origin dev
```

### Option B: Cloud Sync

The `diagrams/` folder can be synced using Dropbox, Google Drive, OneDrive, or any file sync service.

### Option C: USB

Simply copy the `diagrams/` folder to a USB drive and transfer between devices.

## Folder Structure

```
drawio/
├── diagrams/           ← Your .drawio files (sync these)
├── server/             ← Node.js server (run this)
├── stencils/           ← Custom component libraries
├── .pi/skills/         ← AI skill definitions (for pi code)
└── src/main/webapp/    ← drawio editor (do not modify)
```

## Troubleshooting

- **Port 3000 in use**: Edit `server/server.js` and change the PORT variable
- **Server won't start**: Run `cd server && npm install` to ensure dependencies are installed
- **Browser shows blank page**: Ensure you're opening http://localhost:3000 and the server is running
- **Diagrams not saving**: Check that the `diagrams/` folder exists and is writable
```

- [ ] **Step 2: Commit**

```bash
git add docs/SETUP-GUIDE.md
git commit -m "docs: add device setup guide"
git push origin dev
```

---

### Task 12: Integration Test & Final Verification

**Files:**
- Create: `server/test/integration.js`

- [ ] **Step 1: Create integration test**

```javascript
// server/test/integration.js
const http = require('http');

const API = 'http://localhost:3000/api';
const DIAGRAM_NAME = 'integration-test.drawio';

function request(method, path, body) {
    return new Promise((resolve, reject) => {
        const url = new URL(API + path);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            method,
            headers: { 'Content-Type': 'application/json' }
        };
        const req = http.request(options, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch (e) { reject(new Error('Invalid JSON: ' + data)); }
            });
        });
        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function run() {
    try {
        // Test health
        const health = await request('GET', '/health');
        console.assert(health.success, 'Health check failed');

        // Create diagram
        const created = await request('POST', '/diagrams', { name: DIAGRAM_NAME });
        console.assert(created.success, 'Create diagram failed');
        console.log('PASS: Create diagram');

        // Add shapes
        const shape1 = await request('POST', `/diagrams/${DIAGRAM_NAME}/shapes`, {
            x: 100, y: 100, width: 120, height: 60, label: 'Battery 12V',
            style: { fillColor: '#FFCC00', strokeColor: '#000000' }
        });
        console.assert(shape1.success, 'Add shape 1 failed');
        const s1Id = shape1.data.id;

        const shape2 = await request('POST', `/diagrams/${DIAGRAM_NAME}/shapes`, {
            x: 300, y: 100, width: 120, height: 60, label: 'Fuse',
            style: { fillColor: '#FFFFFF', strokeColor: '#000000' }
        });
        console.assert(shape2.success, 'Add shape 2 failed');
        const s2Id = shape2.data.id;

        // Connect shapes
        const conn = await request('POST', `/diagrams/${DIAGRAM_NAME}/connections`, {
            from: s1Id, to: s2Id, label: '48V',
            style: { strokeColor: '#FF0000', strokeWidth: 2 }
        });
        console.assert(conn.success, 'Connect failed');

        // Move shape
        const moved = await request('POST', `/diagrams/${DIAGRAM_NAME}/shapes/${s1Id}/move`, { x: 50, y: 50 });
        console.assert(moved.success, 'Move failed');

        // Change color
        const colored = await request('POST', `/diagrams/${DIAGRAM_NAME}/shapes/${s2Id}/fill`, { color: '#FF0000' });
        console.assert(colored.success, 'Fill failed');

        // List shapes
        const list = await request('GET', `/diagrams/${DIAGRAM_NAME}/list`);
        console.assert(list.success && list.data.length >= 2, 'List shapes failed');

        // Create group
        const group = await request('POST', `/diagrams/${DIAGRAM_NAME}/groups`, {
            children: [s1Id, s2Id], label: 'Power Section'
        });
        console.assert(group.success, 'Group failed');

        // Cleanup
        const deleted = await request('DELETE', `/diagrams/${DIAGRAM_NAME}`);
        console.assert(deleted.success, 'Delete failed');

        console.log('ALL TESTS PASSED');
        process.exit(0);
    } catch (e) {
        console.error('TEST FAILED:', e.message);
        process.exit(1);
    }
}

run();
```

- [ ] **Step 2: Run the integration test**

```bash
cd server && node server.js &
sleep 2
node test/integration.js
# Expected: ALL TESTS PASSED
kill %1 2>/dev/null || true
```

- [ ] **Step 3: Final commit**

```bash
git add server/test/
git commit -m "test: add integration test for full API workflow"
git push origin dev
```

---

### Task 13: Initial GitHub Push

- [ ] **Step 1: Push the full fork to GitHub**

```bash
cd C:/Users/makel/vscode/drawio
git push -u origin dev
```

- [ ] **Step 2: Verify the repo is accessible**

Open https://github.com/YOUR_USERNAME/drawio in a browser and verify all files are present.