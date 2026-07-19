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
    // Split all mxCell tags and process individually
    const tagRegex = /<mxCell\s+([^>]*?)(?:\/>|>([\s\S]*?)<\/mxCell>)/g;
    // Use exec repeatedly on fresh copy
    const copy = xmlString;
    const parts = copy.split('<mxCell ');
    for (let i = 1; i < parts.length; i++) {
        const part = parts[i];
        const selfCloseIdx = part.indexOf('/>');
        const openEndIdx = part.indexOf('>');
        const closeIdx = part.indexOf('</mxCell>');
        
        let attrsStr, innerContent = null;
        
        if (selfCloseIdx >= 0 && (openEndIdx < 0 || selfCloseIdx < openEndIdx)) {
            // Self-closing tag: <mxCell .../>
            attrsStr = part.substring(0, selfCloseIdx);
        } else if (openEndIdx >= 0 && closeIdx >= 0) {
            // Regular tag: <mxCell ...>...</mxCell>
            attrsStr = part.substring(0, openEndIdx);
            innerContent = part.substring(openEndIdx + 1, closeIdx);
        } else {
            continue;
        }
        
        const attrs = parseAttributes(attrsStr);
        const id = attrs.id;
        if (!id) continue;
        cells[id] = {
            id, parent: attrs.parent || null,
            vertex: attrs.vertex === '1', edge: attrs.edge === '1',
            value: attrs.value || '', style: attrs.style || '',
            source: attrs.source || null, target: attrs.target || null,
            geometry: innerContent ? parseGeometry(innerContent) : null
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
    if (!content) return null;
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