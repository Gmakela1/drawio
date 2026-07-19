# drawio AI Fork — Setup Guide

This guide covers setting up this drawio AI fork on any device.

## Prerequisites

- **Node.js** 18 or later
- **Git**
- **pi code** (optional, for AI diagramming features)

## Installation

### 1. Clone the repository

```bash
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

### 3. Start the server

```bash
cd server
node server.js
```

### 4. Open the editor

Open http://localhost:3000 in your browser.

### 5. (Optional) Enable AI features

If you have pi code installed, navigate to the project folder:

```bash
cd drawio
pi code
```

The drawio skill will be available for AI-driven diagramming. The skill provides tools to call the REST API for creating and editing diagrams.

## API Examples

```bash
# Create a diagram
curl -X POST http://localhost:3000/api/diagrams \
  -H "Content-Type: application/json" \
  -d '{"name": "tractor-power.drawio"}'

# Add a battery shape
curl -X POST http://localhost:3000/api/diagrams/tractor-power.drawio/shapes \
  -H "Content-Type: application/json" \
  -d '{"x":100,"y":100,"width":120,"height":60,"label":"Battery 48V","style":{"fillColor":"#FFCC00","strokeColor":"#000000"}}'

# Connect two shapes
curl -X POST http://localhost:3000/api/diagrams/tractor-power.drawio/connections \
  -H "Content-Type: application/json" \
  -d '{"from":"shape_id_1","to":"shape_id_2","label":"48V","style":{"strokeColor":"#FF0000"}}'
```

## Syncing Diagrams Across Devices

### Option A: Git (Recommended)

```bash
cd drawio
git add diagrams/
git commit -m "update diagrams"
git push origin dev
```

On another device:
```bash
git pull origin dev
```

### Option B: Cloud Sync

The `diagrams/` folder can be synced via Dropbox, Google Drive, OneDrive, or any file sync service.

### Option C: USB

Copy the `diagrams/` folder to a USB drive and transfer between devices.

## Folder Reference

```
drawio/
├── diagrams/           ← Your .drawio files (sync these between devices)
├── server/             ← Node.js server (run this)
│   ├── server.js       ← Entry point
│   ├── routes/         ← API endpoints
│   └── lib/            ← XML builder + file manager
├── stencils/           ← Custom component libraries
├── .pi/skills/         ← AI skill definitions (for pi code)
└── src/main/webapp/    ← drawio editor (do not modify)
```

## Troubleshooting

- **Port 3000 in use**: Edit the `PORT` variable in `server/server.js`
- **Server won't start**: Run `cd server && npm install`
- **Browser shows blank page**: Ensure you're on http://localhost:3000
- **Diagrams not saving**: Check `diagrams/` folder exists and is writable