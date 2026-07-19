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