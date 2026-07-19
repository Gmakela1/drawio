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

// Inject SSE refresh + localStorage persistence + auto-load script
app.use((req, res, next) => {
    const originalSend = res.send;
    res.send = function(body) {
        if (typeof body === 'string' && res.get('Content-Type')?.includes('text/html')) {
            const sseScript = `
<script>
(function() {
    var LS_KEY = 'drawio_current_diagram';

    // --- Auto-load: if URL has ?file=xxx, auto-redirect to editor with it ---
    (function() {
        var urlParams = new URLSearchParams(window.location.search);
        var fileParam = urlParams.get('file');
        if (fileParam) {
            localStorage.setItem(LS_KEY, fileParam);
            // Poll for editor readiness, then load via drawio's built-in mechanics
            var interval = setInterval(function() {
                if (window.App && window.editorUi && window.editorUi.editor) {
                    clearInterval(interval);
                    fetch('/api/diagrams/' + encodeURIComponent(fileParam))
                        .then(function(r) { return r.json(); })
                        .then(function(resp) {
                            if (resp.success && resp.data) {
                                var ui = window.editorUi;
                                var data = resp.data.xml;
                                ui.editor.setGraphXml(mxUtils.parseXml(data).documentElement);
                                if (ui.currentFile) {
                                    ui.currentFile.setData(data);
                                    ui.currentFile.title = fileParam;
                                }
                                console.log('Loaded:', fileParam);
                            }
                        }).catch(function(e) { console.log('Load error:', e); });
                }
            }, 300);
        }
    })();

    // --- Track the current diagram name ---
    setInterval(function() {
        try {
            if (window.editorUi && window.editorUi.getCurrentFile) {
                var file = window.editorUi.getCurrentFile();
                if (file && file.getTitle && file.getTitle()) {
                    localStorage.setItem(LS_KEY, file.getTitle());
                }
            }
        } catch(e) {}
    }, 3000);

    // --- SSE: watch ALL file changes, reload if current diagram matches ---
    var evtSource = new EventSource('/api/watch');
    evtSource.onmessage = function(e) {
        var data = JSON.parse(e.data);
        if (data.event === 'reload') {
            var current = localStorage.getItem(LS_KEY);
            if (!current || !data.file || data.file === current) {
                console.log('Reloading for:', data.file);
                window.location.reload();
            }
        }
    };
    evtSource.onerror = function() {};

    // --- Save current diagram name before page unload ---
    window.addEventListener('beforeunload', function() {
        try {
            if (window.editorUi && window.editorUi.getCurrentFile) {
                var file = window.editorUi.getCurrentFile();
                if (file && file.getTitle && file.getTitle()) {
                    localStorage.setItem(LS_KEY, file.getTitle());
                }
            }
        } catch(e) {}
    });
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