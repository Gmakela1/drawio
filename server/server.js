const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const webappPath = path.join(__dirname, '..', 'src', 'main', 'webapp');

// Serve static files EXCEPT index.html (handled below)
app.use(express.static(webappPath, { index: false }));

// Custom editor page
app.get('/editor', (req, res) => {
    res.sendFile(path.join(__dirname, 'editor.html'));
});

// API routes
app.use('/api', require('./routes/index'));

// Serve index.html with SSE auto-refresh injected
app.get('/', (req, res) => {
    const indexPath = path.join(webappPath, 'index.html');
    fs.readFile(indexPath, 'utf8', (err, html) => {
        if (err) return res.status(500).send('Error loading editor');
        const sseScript = `
<script>
(function() {
    var evtSource = new EventSource('/api/watch');
    evtSource.onmessage = function(e) {
        try {
            var data = JSON.parse(e.data);
            if (data.event === 'reload') {
                console.log('File changed: ' + data.file + ' - reloading');
                window.location.reload();
            }
        } catch(ex) {}
    };
})();
</script>`;
        html = html.replace('</body>', sseScript + '</body>');
        res.send(html);
    });
});

app.listen(PORT, () => {
    console.log(`drawio AI server running at http://localhost:${PORT}`);
    console.log(`API available at http://localhost:${PORT}/api`);
});