# drawio AI Fork — Setup Guide

This guide covers everything you need to set up, run, and use this drawio AI-powered fork on any device. It's designed for electrical engineers and developers creating wiring diagrams for vehicles, machinery, and power distribution systems.

## Prerequisites

- **Node.js** 18 or later
- **Git** (for version control and syncing)
- **pi code** (optional, for AI-assisted diagramming features)
- A modern browser (Chrome, Firefox, Edge)

## Installation

### 1. Clone the repository

```bash
cd ~/vscode
git clone https://github.com/Gmakela1/drawio.git
cd drawio
git checkout dev
```

### 2. Install server dependencies

```bash
cd server
npm install
cd ..
```

### 3. Set up the projects directory (e-ai-designs)

This is where your diagrams and AI skills live — separate from the drawio source code.

```bash
cd ~
mkdir -p e-ai-designs/diagrams
mkdir -p e-ai-designs/stencils
mkdir -p e-ai-designs/.pi/skills

# Copy the AI skills
cp -r ~/vscode/drawio/.pi/skills/* ~/e-ai-designs/.pi/skills/

# Create settings for pi code
echo '{"skills":[".pi/skills"]}' > ~/e-ai-designs/.pi/settings.json
```

### 4. Start the server

```bash
cd ~/vscode/drawio/server
node server.js
```

You should see:
```
drawio AI server running at http://localhost:3000
API available at http://localhost:3000/api
Editor with auto-load: http://localhost:3000/editor?file=NAME.drawio
```

### 5. Open the editor

Navigate to **http://localhost:3000/editor** in your browser.

You'll see a custom toolbar at the top with:
- **Diagram dropdown** — Select any `.drawio` file from the `diagrams/` folder
- **Load** — Load the selected diagram into the editor
- **💾 Save** — Save changes back to the loaded file (also works with **Ctrl+S**)
- **Save As** — Save a copy to a new filename
- **➕ New** — Create a blank new diagram

### 6. (Optional) Enable AI features

If you have pi code installed, navigate to the **e-ai-designs** folder (not the drawio folder):

```bash
cd ~/e-ai-designs
pi code
```

This keeps the AI focused on your electrical designs and skills, without being distracted by the drawio source code.

## How It Works

```
┌──────────────────────────────────────────────────┐
│  pi code terminal (AI)                            │
│  ┌──────────────────────────────────────────────┐ │
│  │  drawio skill → REST API calls               │ │
│  └──────────────┬───────────────────────────────┘ │
└─────────────────┼─────────────────────────────────┘
                  │ HTTP
                  ▼
┌──────────────────────────────────────────────────┐
│  Node.js Server (localhost:3000)                  │
│  ┌──────────┐  ┌──────────┐  ┌─────────────────┐ │
│  │ API      │  │ XML      │  │ File Watcher    │ │
│  │ Routes   │──│ Builder  │──│ + SSE push      │ │
│  └──────────┘  └──────────┘  └───────┬─────────┘ │
│  ┌──────────────────────────────────┐│            │
│  │ Static files: src/main/webapp/   ││            │
│  │ + custom editor.html at /editor  ││            │
│  └──────────────┬───────────────────┘│            │
└─────────────────┼────────────────────┼────────────┘
                  │ SSE live updates    │
                  ▼                     ▼
┌──────────────────────────────────────────────────┐
│  Browser (http://localhost:3000/editor)           │
│  - Loads diagrams via API                          │
│  - SSE pushes updates in-place (no page reload)   │
│  - Save/Save As buttons persist to disk           │
│  - Polling fallback every 10s if SSE drops        │
└──────────────────────────────────────────────────┘
```

### Key Features

- **Live in-place updates** — When the AI (or any API caller) modifies a diagram, the browser updates automatically with **no page reload**. Your editor state is preserved.
- **Save/Save As** — Persist your manual edits in the editor back to the `diagrams/` folder on disk.
- **SSE + polling** — Server-Sent Events push changes instantly, with a 10-second polling fallback for reliability.

## REST API Reference

All endpoints are at `http://localhost:3000/api`. All responses use `{ success: true, data: ... }` or `{ success: false, error: "..." }`.

### Health

```bash
curl http://localhost:3000/api/health
# → {"success":true,"data":{"status":"ok","version":"1.0.0"}}
```

### Diagrams

```bash
# List all diagrams
curl http://localhost:3000/api/diagrams

# Create a new blank diagram
curl -X POST http://localhost:3000/api/diagrams \
  -H "Content-Type: application/json" \
  -d '{"name": "my-project.drawio"}'

# Get a diagram's XML
curl http://localhost:3000/api/diagrams/my-project.drawio

# Overwrite a diagram
curl -X PUT http://localhost:3000/api/diagrams/my-project.drawio \
  -H "Content-Type: application/json" \
  -d '{"xml": "<?xml ...>"}'

# Delete a diagram
curl -X DELETE http://localhost:3000/api/diagrams/my-project.drawio

# List all shapes in a diagram
curl http://localhost:3000/api/diagrams/my-project.drawio/list
```

### Shapes

```bash
# Add a shape
curl -X POST http://localhost:3000/api/diagrams/my-project.drawio/shapes \
  -H "Content-Type: application/json" \
  -d '{"x":100,"y":100,"width":120,"height":60,"label":"Battery 48V","style":{"fillColor":"#FFCC00","strokeColor":"#000000","rounded":"1"}}'

# Move a shape
curl -X POST http://localhost:3000/api/diagrams/my-project.drawio/shapes/SHAPE_ID/move \
  -H "Content-Type: application/json" \
  -d '{"x":50,"y":50}'

# Change fill color
curl -X POST http://localhost:3000/api/diagrams/my-project.drawio/shapes/SHAPE_ID/fill \
  -H "Content-Type: application/json" \
  -d '{"color":"#FF0000"}'

# Update label
curl -X POST http://localhost:3000/api/diagrams/my-project.drawio/shapes/SHAPE_ID/label \
  -H "Content-Type: application/json" \
  -d '{"label":"New Label"}'

# Delete a shape
curl -X DELETE http://localhost:3000/api/diagrams/my-project.drawio/shapes/SHAPE_ID
```

### Connections

```bash
# Connect two shapes
curl -X POST http://localhost:3000/api/diagrams/my-project.drawio/connections \
  -H "Content-Type: application/json" \
  -d '{"from":"SHAPE_ID_1","to":"SHAPE_ID_2","label":"48V","style":{"strokeColor":"#FF0000","strokeWidth":2}}'

# Update a connection
curl -X PUT http://localhost:3000/api/diagrams/my-project.drawio/connections/EDGE_ID \
  -H "Content-Type: application/json" \
  -d '{"label":"Updated Label","style":{"strokeColor":"#0066FF","strokeWidth":1}}'

# Delete a connection
curl -X DELETE http://localhost:3000/api/diagrams/my-project.drawio/connections/EDGE_ID
```

### Groups

```bash
# Create a group from shapes
curl -X POST http://localhost:3000/api/diagrams/my-project.drawio/groups \
  -H "Content-Type: application/json" \
  -d '{"children":["SHAPE_ID_1","SHAPE_ID_2"],"label":"Power Section"}'

# Add a shape to a group
curl -X POST http://localhost:3000/api/diagrams/my-project.drawio/groups/GROUP_ID/add \
  -H "Content-Type: application/json" \
  -d '{"childId":"SHAPE_ID_3"}'

# Ungroup (keeps children)
curl -X DELETE http://localhost:3000/api/diagrams/my-project.drawio/groups/GROUP_ID
```

### Pinout / IC Components

```bash
# Create a microcontroller with pinout
curl -X POST http://localhost:3000/api/diagrams/my-project.drawio/pinout \
  -H "Content-Type: application/json" \
  -d '{"x":100,"y":200,"width":200,"height":300,"label":"VCU","pins":[
    {"side":"left","index":1,"label":"IGN","type":"input"},
    {"side":"right","index":1,"label":"CON_EN","type":"output"},
    {"side":"top","index":1,"label":"VCC","type":"power"},
    {"side":"bottom","index":1,"label":"GND","type":"ground"}
  ]}'
```

Pin types and their colors: `power` (#FF0000), `ground` (#000000), `gpio` (#00AA00), `input` (#0066FF), `output` (#FF8800), `analog` (#AA00FF).

### Stencil Libraries

```bash
# List stencil libraries
curl http://localhost:3000/api/stencils

# Create a new library
curl -X POST http://localhost:3000/api/stencils \
  -H "Content-Type: application/json" \
  -d '{"name":"tractor-components"}'
```

## Syncing Diagrams Across Devices

### Option A: Git (Recommended)

```bash
# After making changes in the editor (click Save or use Ctrl+S):
cd drawio
git add diagrams/
git commit -m "update wiring diagrams"
git push origin dev
```

On another device:
```bash
git pull origin dev
# Restart the server to pick up new diagrams
```

### Option B: Cloud Sync

The `diagrams/` folder can be synced via Dropbox, Google Drive, OneDrive, or any file sync service. The server auto-detects new files in real-time.

### Option C: USB

Copy the `diagrams/` folder to a USB drive and transfer between devices.

## Syncing Upstream (jgraph/drawio Releases)

This fork tracks the official drawio source. To pull in new drawio releases without losing our custom code:

```bash
# Fetch the latest drawio release
git fetch upstream

# Merge into your dev branch
# Our custom code (server/, .pi/, docs/) doesn't exist upstream so no conflicts
git merge upstream/master --no-edit

# Push the merged result
git push origin dev
```

## Folder Structure

The project spans two directories:

```
~/vscode/drawio/              ← Server code (you don't pi code here)
├── server/                   ← Node.js server
│   ├── server.js             ← Entry point (port 3000, static files + API)
│   ├── config.js             ← Points to e-ai-designs/ for diagrams/stencils
│   ├── editor.html           ← Custom editor page (diagram selector, save buttons)
│   ├── routes/               ← API endpoints
│   │   ├── diagrams.js       ← Diagram CRUD
│   │   ├── shapes.js         ← Shape operations
│   │   ├── connections.js    ← Edge management
│   │   ├── groups.js         ← Group/ungroup
│   │   ├── pinout.js         ← IC pinout
│   │   └── stencils.js       ← Custom stencil libraries
│   ├── lib/                  ← Core libraries
│   │   ├── xml-builder.js    ← mxGraph XML construction
│   │   └── file-manager.js   ← File watcher, save/load, SSE push
│   └── test/
│       └── integration.js    ← 16-test integration suite
├── diagrams/                 ← README points to e-ai-designs/
└── src/main/webapp/          ← drawio editor (do not modify)

~/e-ai-designs/               ← AI workspace (pi code runs HERE)
├── diagrams/                 ← Your .drawio files (sync these)
├── stencils/                 ← Custom component libraries
└── .pi/
    ├── settings.json
    └── skills/
        ├── drawio/                       ← Main API skill
        ├── electrical-wiring-standards/  ← Wiring conventions
        └── drawio-layout/               ← Layout best practices
```

## SSE Live Update System

The server pushes changes to the browser in real-time:

1. **API modifies a diagram** — The server writes the file and immediately pushes an SSE event
2. **Browser receives event** — The editor fetches the new XML via API
3. **In-place update** — `editorUi.editor.setGraphXml()` applies the new XML — **no page reload**
4. **Polling fallback** — Every 10 seconds the browser checks for missed changes (in case SSE drops)

## Electrical Wiring Conventions

When creating diagrams, follow these color conventions:

| Color | Hex | Usage |
|-------|-----|-------|
| Red | `#FF0000` | HV Power (48V+ positive) |
| Black | `#000000` | Ground / negative return |
| Blue | `#0066FF` | LV Power (12V/24V) / control signals |
| Orange | `#FF8800` | Outputs / driven loads |
| Green | `#00AA00` | Inputs / sensors |
| Yellow | `#FFCC00` | Caution / auxiliary / battery |
| Purple | `#AA00FF` | Analog / special / CAN bus |

## Running the Integration Tests

```bash
cd server
node server.js &
sleep 2
node test/integration.js
# Expected: ALL TESTS PASSED (16 tests)
```

## Troubleshooting

### Port 3000 in use
```bash
# Kill the process on port 3000
npx kill-port 3000
# Or change the port in server/server.js
```

### Server won't start
```bash
cd server && npm install
```

### Browser shows blank page
- Ensure you're on **http://localhost:3000/editor** (not the main `/` path)
- Check the server is running (`curl http://localhost:3000/api/health`)
- Open browser dev tools console for errors

### Diagrams not saving
- Check `diagrams/` folder exists and is writable
- Verify the API is running (`curl http://localhost:3000/api/diagrams`)

### SSE not updating
- The editor has a 10-second polling fallback — wait and see if it catches up
- Check browser console for SSE connection errors
- The server logs show file changes in real-time

### Editor UI not loading
- The editor waits up to 60 seconds for the drawio editor to initialize
- If it times out, refresh the page and click "Load" manually

### "Cannot GET /editor"
- Make sure you're on the `dev` branch (`git checkout dev`)
- The `/editor` route was added in commit `f671d4e4`
- Run `git pull origin dev` to get the latest code