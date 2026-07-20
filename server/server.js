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
    var LS_TS = 'drawio_timestamps';

    // --- Auto-reopen: if we stored a file, redirect to /editor ---
    var lastFile = localStorage.getItem(LS_FILE);
    var urlFile = new URLSearchParams(window.location.search).get('file');
    if (urlFile) {
        // Already on /?file=xxx, save it and proceed
        localStorage.setItem(LS_FILE, urlFile);
    } else if (lastFile && !window.location.pathname.includes('editor')) {
        // Redirect to /editor which auto-loads the file
        window.location.href = '/editor?file=' + encodeURIComponent(lastFile);
        return; // stop execution
    }

    // --- Poll every 2 seconds for file changes ---
    var lastTimestamps = JSON.parse(localStorage.getItem(LS_TS) || '{}');
    setInterval(function() {
        fetch('/api/diagrams')
            .then(function(r) { return r.json(); })
            .then(function(resp) {
                if (!resp.success) return;
                var changed = false;
                resp.data.forEach(function(f) {
                    var ts = new Date(f.modified).getTime();
                    if (lastTimestamps[f.name] && lastTimestamps[f.name] !== ts) {
                        console.log('Changed: ' + f.name);
                        changed = true;
                    }
                    lastTimestamps[f.name] = ts;
                });
                localStorage.setItem(LS_TS, JSON.stringify(lastTimestamps));
                if (changed) {
                    window.location.reload();
                }
            })
            .catch(function() {});
    }, 2000);
})();
</script>`;
        html = html.replace('</body>', injectScript + '</body>');
        res.send(html);
    });
});

app.listen(PORT, () => {
    console.log('drawio AI server running at http://localhost:3000');
    console.log('API available at http://localhost:3000/api');
    console.log('Editor with auto-load: http://localhost:3000/editor?file=NAME.drawio');
});