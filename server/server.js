const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const webappPath = path.join(__dirname, '..', 'src', 'main', 'webapp');

// Serve static files EXCEPT index.html
app.use(express.static(webappPath, { index: false }));

// API routes
app.use('/api', require('./routes/index'));

// Serve index.html with auto-refresh + auto-reopen
app.get('/', (req, res) => {
    const indexPath = path.join(webappPath, 'index.html');
    fs.readFile(indexPath, 'utf8', (err, html) => {
        if (err) return res.status(500).send('Error loading editor');
        const injectScript = `
<script>
(function() {
    var LS_FILE = 'drawio_last_file';

    // --- Auto-reopen: if we stored a file, redirect to /editor ---
    var lastFile = localStorage.getItem(LS_FILE);
    var urlFile = new URLSearchParams(window.location.search).get('file');
    if (urlFile) {
        localStorage.setItem(LS_FILE, urlFile);
    } else if (lastFile) {
        // Redirect to /editor which auto-loads the file and supports in-place updates
        window.location.href = '/editor?file=' + encodeURIComponent(lastFile);
        return;
    }

    // --- If we're still here, try to capture editor UI for in-place updates ---
    var editorUi = null;
    var sseConnected = false;

    function captureEditorUi() {
        if (window.editorUi) {
            editorUi = window.editorUi;
            return true;
        }
        if (window.Draw && window.Draw.loadPlugin && typeof window.Draw.loadPlugin === 'function') {
            try {
                Draw.loadPlugin(function(ui) { window.editorUi = ui; editorUi = ui; });
                return true;
            } catch(e) {}
        }
        return false;
    }

    function tryInPlaceUpdate() {
        var name = localStorage.getItem(LS_FILE);
        if (!name || !editorUi) return false;
        fetch('/api/diagrams/' + encodeURIComponent(name))
            .then(function(r) { return r.json(); })
            .then(function(resp) {
                if (!resp.success || !resp.data) return;
                try {
                    var doc = mxUtils.parseXml(resp.data.xml);
                    editorUi.editor.setGraphXml(doc.documentElement);
                    console.log('SSE: in-place updated ' + name);
                } catch(e) {
                    console.log('SSE: in-place update failed, full reload', e);
                    window.location.reload();
                }
            })
            .catch(function() { window.location.reload(); });
        return true;
    }

    // --- SSE connection for live updates ---
    var evtSource = new EventSource('/api/watch');
    evtSource.onmessage = function(e) {
        try {
            var data = JSON.parse(e.data);
            if (data.event === 'connected') {
                sseConnected = true;
                console.log('SSE connected');
                return;
            }
            if (data.event === 'reload') {
                console.log('SSE: change detected - ' + (data.file || 'unknown'));
                // Try to capture editor UI and update in-place
                captureEditorUi();
                if (editorUi) {
                    tryInPlaceUpdate();
                } else {
                    // Fallback: wait a moment then try again
                    setTimeout(function() {
                        captureEditorUi();
                        if (editorUi) {
                            tryInPlaceUpdate();
                        } else {
                            window.location.reload();
                        }
                    }, 1000);
                }
            }
        } catch (err) {
            console.log('SSE error:', err);
        }
    };
    evtSource.onerror = function() {
        console.log('SSE disconnected, will auto-reconnect');
    };

    // --- Polling fallback (every 10s) in case SSE drops ---
    var lastTimestamps = JSON.parse(localStorage.getItem('drawio_timestamps') || '{}');
    setInterval(function() {
        fetch('/api/diagrams')
            .then(function(r) { return r.json(); })
            .then(function(resp) {
                if (!resp.success) return;
                var changed = false;
                resp.data.forEach(function(f) {
                    var ts = new Date(f.modified).getTime();
                    if (lastTimestamps[f.name] && lastTimestamps[f.name] !== ts) {
                        console.log('Polling: changed - ' + f.name);
                        changed = true;
                    }
                    lastTimestamps[f.name] = ts;
                });
                localStorage.setItem('drawio_timestamps', JSON.stringify(lastTimestamps));
                if (changed) {
                    captureEditorUi();
                    if (editorUi) {
                        tryInPlaceUpdate();
                    } else {
                        window.location.reload();
                    }
                }
            })
            .catch(function() {});
    }, 10000);
})();
</script>`;
        html = html.replace('</body>', injectScript + '</body>');
        res.send(html);
    });
});

// Serve the custom editor page at /editor
app.get('/editor', (req, res) => {
    const editorPath = path.join(__dirname, 'editor.html');
    fs.readFile(editorPath, 'utf8', (err, html) => {
        if (err) return res.status(500).send('Error loading editor page');
        res.send(html);
    });
});

app.listen(PORT, () => {
    console.log('drawio AI server running at http://localhost:3000');
    console.log('API available at http://localhost:3000/api');
    console.log('Editor with auto-load: http://localhost:3000/editor?file=NAME.drawio');
});