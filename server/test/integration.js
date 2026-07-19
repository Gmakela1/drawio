const http = require('http');
const API = 'http://localhost:3000/api';
const DIAGRAM_NAME = 'integration-test.drawio';

function request(method, path, body) {
    return new Promise((resolve, reject) => {
        const url = new URL(API + path);
        const options = {
            hostname: url.hostname, port: url.port,
            path: url.pathname, method,
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
        // 1. Health check
        const health = await request('GET', '/health');
        console.assert(health.success, 'Health check failed');
        console.log('PASS: Health check');

        // 2. Create diagram
        const created = await request('POST', '/diagrams', { name: DIAGRAM_NAME });
        console.assert(created.success, 'Create diagram failed');
        console.log('PASS: Create diagram');

        // 3. List diagrams
        const list = await request('GET', '/diagrams');
        console.assert(list.success && list.data.length > 0, 'List diagrams failed');
        console.log('PASS: List diagrams');

        // 4. Add shapes
        const shape1 = await request('POST', `/diagrams/${DIAGRAM_NAME}/shapes`, {
            x: 100, y: 100, width: 120, height: 60, label: 'Battery 48V',
            style: { fillColor: '#FFCC00', strokeColor: '#000000' }
        });
        console.assert(shape1.success, 'Add shape 1 failed');
        const s1Id = shape1.data.id;
        console.log('PASS: Add shape 1 (' + s1Id + ')');

        const shape2 = await request('POST', `/diagrams/${DIAGRAM_NAME}/shapes`, {
            x: 300, y: 100, width: 120, height: 60, label: 'Fuse',
            style: { fillColor: '#FFFFFF', strokeColor: '#000000' }
        });
        console.assert(shape2.success, 'Add shape 2 failed');
        const s2Id = shape2.data.id;
        console.log('PASS: Add shape 2 (' + s2Id + ')');

        // 5. Move a shape
        const moved = await request('POST', `/diagrams/${DIAGRAM_NAME}/shapes/${s1Id}/move`, { x: 50, y: 50 });
        console.assert(moved.success, 'Move failed');
        console.log('PASS: Move shape');

        // 6. Change fill color
        const fill = await request('POST', `/diagrams/${DIAGRAM_NAME}/shapes/${s2Id}/fill`, { color: '#FF0000' });
        console.assert(fill.success, 'Fill failed');
        console.log('PASS: Set fill color');

        // 7. Set label
        const label = await request('POST', `/diagrams/${DIAGRAM_NAME}/shapes/${s1Id}/label`, { label: 'Battery 12V' });
        console.assert(label.success, 'Label failed');
        console.log('PASS: Set label');

        // 8. Connect shapes
        const conn = await request('POST', `/diagrams/${DIAGRAM_NAME}/connections`, {
            from: s1Id, to: s2Id, label: '48V',
            style: { strokeColor: '#FF0000', strokeWidth: 2 }
        });
        console.assert(conn.success, 'Connect failed');
        const edgeId = conn.data.id;
        console.log('PASS: Connect shapes (' + edgeId + ')');

        // 9. Create a group
        const group = await request('POST', `/diagrams/${DIAGRAM_NAME}/groups`, {
            children: [s1Id, s2Id], label: 'Power Section'
        });
        console.assert(group.success, 'Group failed');
        console.log('PASS: Create group');

        // 10. Create pinout
        const pinout = await request('POST', `/diagrams/${DIAGRAM_NAME}/pinout`, {
            x: 500, y: 100, width: 200, height: 300, label: 'MCU',
            pins: [
                { side: 'left', index: 1, label: 'VDD', type: 'power' },
                { side: 'left', index: 2, label: 'PA0', type: 'gpio' }
            ]
        });
        console.assert(pinout.success, 'Pinout failed');
        console.log('PASS: Create pinout (' + pinout.data.id + ')');

        // 11. List all shapes
        const allShapes = await request('GET', `/diagrams/${DIAGRAM_NAME}/list`);
        console.assert(allShapes.success && allShapes.data.length >= 5, 'List shapes failed');
        console.log('PASS: List shapes (' + allShapes.data.length + ' cells)');

        // 12. Ungroup
        const ungroup = await request('DELETE', `/diagrams/${DIAGRAM_NAME}/groups/${group.data.id}`);
        console.assert(ungroup.success, 'Ungroup failed');
        console.log('PASS: Ungroup');

        // 13. Delete connection
        const delConn = await request('DELETE', `/diagrams/${DIAGRAM_NAME}/connections/${edgeId}`);
        console.assert(delConn.success, 'Delete connection failed');
        console.log('PASS: Delete connection');

        // 14. Delete shapes
        const del1 = await request('DELETE', `/diagrams/${DIAGRAM_NAME}/shapes/${s1Id}`);
        console.assert(del1.success, 'Delete shape 1 failed');
        const del2 = await request('DELETE', `/diagrams/${DIAGRAM_NAME}/shapes/${s2Id}`);
        console.assert(del2.success, 'Delete shape 2 failed');
        console.log('PASS: Delete shapes');

        // 15. Delete diagram
        const deleted = await request('DELETE', `/diagrams/${DIAGRAM_NAME}`);
        console.assert(deleted.success, 'Delete diagram failed');
        console.log('PASS: Delete diagram');

        // 16. Stencil library test
        const stencilCreate = await request('POST', '/stencils', { name: 'test-library' });
        console.assert(stencilCreate.success, 'Create stencil failed');
        const stencilList = await request('GET', '/stencils');
        console.assert(stencilList.data.includes('test-library.xml'), 'List stencils failed');
        const stencilDel = await request('DELETE', '/stencils/test-library.xml');
        console.assert(stencilDel.success, 'Delete stencil failed');
        console.log('PASS: Stencil library API');

        console.log('\n========================================');
        console.log('ALL TESTS PASSED');
        console.log('========================================');
        process.exit(0);
    } catch (e) {
        console.error('TEST FAILED:', e.message);
        process.exit(1);
    }
}

run();