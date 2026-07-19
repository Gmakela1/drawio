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

app.listen(PORT, () => {
    console.log(`drawio AI server running at http://localhost:${PORT}`);
    console.log(`API available at http://localhost:${PORT}/api`);
});