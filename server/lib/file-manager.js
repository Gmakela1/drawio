const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const { parseDrawioFile, createEmptyDiagram } = require('./xml-builder');
const config = require('../config');

const DIAGRAMS_DIR = config.diagramsDir;
const sseClients = {};       // per-file SSE clients
const allSseClients = [];    // global SSE clients (watch all files)

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
    // Immediately notify SSE clients — don't wait for chokidar
    notifyChange(name);
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

/**
 * Subscribe to all file changes (global SSE channel).
 */
function watchAllDiagrams(res) {
    allSseClients.push(res);
    res.on('close', () => {
        const idx = allSseClients.indexOf(res);
        if (idx >= 0) allSseClients.splice(idx, 1);
    });
}

function removeSseClient(name, res) {
    if (sseClients[name]) {
        sseClients[name] = sseClients[name].filter(c => c !== res);
        if (sseClients[name].length === 0) delete sseClients[name];
    }
}

function notifyChange(name) {
    const data = JSON.stringify({ event: 'reload', file: name });
    // Notify per-file subscribers
    if (sseClients[name]) {
        for (const res of sseClients[name]) {
            res.write(`data: ${data}\n\n`);
        }
    }
    // Notify global subscribers
    for (const res of allSseClients) {
        res.write(`data: ${data}\n\n`);
    }
}

// Start file watcher (ignore .gitkeep and hidden files)
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
    watchDiagram, watchAllDiagrams, removeSseClient, notifyChange
};