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

// Custom editor page with auto-load + SSE
app.get('/editor', (req, res) => {
    res.sendFile(path.join(__dirname, 'editor.html'));
});

// API routes
const apiRoutes = require('./routes/index');
app.use('/api', apiRoutes);

// Inject SSE auto-refresh script into drawio HTML pages
app.use((req, res, next) => {
    const originalSend = res.send;
    res.send = function(body) {
        if (typeof body === 'string' && res.get('Content-Type')?.includes('text/html')) {
            const sseScript = `
<script>
(function() {
    var evtSource = new EventSource('/api/watch');
    evtSource.onmessage = function(e) {
        try {
            var data = JSON.parse(e.data);
            if (data.event === 'reload') {
                console.log('Diagram changed: ' + data.file + ' - reloading...');
                window.location.reload();
            }
        } catch(ex) {}
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