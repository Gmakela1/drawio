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

// API routes
app.use('/api', require('./routes/index'));

// Serve index.html with polling auto-refresh injected
app.get('/', (req, res) => {
    const indexPath = path.join(webappPath, 'index.html');
    fs.readFile(indexPath, 'utf8', (err, html) => {
        if (err) return res.status(500).send('Error loading editor');
        const pollScript = `
<script>
(function() {
    var LS_KEY = 'drawio_timestamps';
    var lastTimestamps = JSON.parse(localStorage.getItem(LS_KEY) || '{}');

    // Poll every 2 seconds for file changes
    setInterval(function() {
        fetch('/api/diagrams')
            .then(function(r) { return r.json(); })
            .then(function(resp) {
                if (!resp.success) return;
                var changed = false;
                resp.data.forEach(function(f) {
                    var ts = new Date(f.modified).getTime();
                    if (lastTimestamps[f.name] && lastTimestamps[f.name] !== ts) {
                        console.log('File changed: ' + f.name);
                        changed = true;
                    }
                    lastTimestamps[f.name] = ts;
                });
                localStorage.setItem(LS_KEY, JSON.stringify(lastTimestamps));
                if (changed) {
                    window.location.reload();
                }
            })
            .catch(function() {});
    }, 2000);
})();
</script>`;
        html = html.replace('</body>', pollScript + '</body>');
        res.send(html);
    });
});

app.listen(PORT, () => {
    console.log(`drawio AI server running at http://localhost:${PORT}`);
    console.log(`API available at http://localhost:${PORT}/api`);
});