# Design Spec: drawio AI-Powered Diagramming Fork

**Date:** 2026-07-18
**Status:** Draft

## Overview

Fork [jgraph/drawio](https://github.com/jgraph/drawio) (v30.3.14, Apache 2.0) and build a lightweight Node.js server alongside it that provides:
- Local file storage for `.drawio` diagrams
- A REST API for AI-driven diagram manipulation (shapes, connections, styles, pinouts, groups, stencils)
- Real-time browser refresh on file changes
- Project-scoped pi skills for AI interaction via pi code terminal

Primary use case: electrical/power distribution design for vehicles (electric tractor).

## Architecture

```
┌──────────────────────────────────────────────────┐
│                  pi code terminal                  │
│  ┌──────────────────────────────────────────────┐ │
│  │  drawio skill (project-scoped)               │ │
│  │  tools: create_shape, connect, style, etc.   │ │
│  └──────────────┬───────────────────────────────┘ │
└─────────────────┼─────────────────────────────────┘
                  │ HTTP REST calls
                  ▼
┌──────────────────────────────────────────────────┐
│           Node.js Server (localhost:3000)          │
│  ┌──────────┐  ┌──────────┐  ┌─────────────────┐ │
│  │ Routes   │  │ XML      │  │ File Watcher    │ │
│  │ (REST)   │──│ Builder  │──│ (chokidar)      │ │
│  └──────────┘  └──────────┘  └────────┬────────┘ │
│                                       │ SSE      │
│  ┌──────────┐  ┌──────────┐  ┌───────▼────────┐ │
│  │ Stencils │  │ Export   │  │ SSE endpoint   │ │
│  │ Library  │  │ (PNG/SVG)│  │ /api/watch/:name│ │
│  └──────────┘  └──────────┘  └────────────────┘ │
│  ┌──────────────────────────────────────────────┐ │
│  │ Static file serving: src/main/webapp/        │ │
│  │ + server-side injection of refresh script    │ │
│  └──────────────────────────────────────────────┘ │
└──────────────────────┬───────────────────────────┘
                       │ single port (3000)
                       ▼
┌──────────────────────────────────────────────────┐
│   Browser (localhost:3000)                        │
│   ┌──────────────────────────────────────────┐    │
│   │  drawio editor (unmodified upstream)     │    │
│   │  - auto-refresh via injected SSE script  │    │
│   │  - saves to diagrams/ folder             │    │
│   └──────────────────────────────────────────┘    │
└──────────────────────────────────────────────────┘
```

## Project Structure

```
drawio/
├── src/main/webapp/          ← drawio upstream (unchanged, served as-is)
├── diagrams/                 ← YOUR .drawio files live here (project root)
├── server/                   ← Our Node.js server
│   ├── server.js             ← Express entry point
│   ├── package.json
│   ├── docs/
│   │   └── LLM-API-REFERENCE.md  ← Full API docs for AI model
│   ├── routes/
│   │   ├── diagrams.js       ← Diagram CRUD
│   │   ├── shapes.js         ← Shape manipulation + pinouts
│   │   ├── connections.js    ← Edge/connection management
│   │   ├── stencils.js       ← Custom stencil libraries
│   │   └── export.js         ← PNG/SVG export
│   ├── lib/
│   │   ├── xml-builder.js    ← mxGraph XML construction
│   │   ├── file-manager.js   ← File watcher, save/load
│   │   └── stencils.js       ← Stencil library loader
├── stencils/                 ← Custom stencil XML files
│   └── custom/
├── .pi/
│   └── skills/
│       └── drawio/
│           ├── SKILL.md          ← pi skill definition
│           └── api-reference.md  ← Detailed API reference for AI
├── docs/
│   ├── SETUP-GUIDE.md        ← Device setup instructions
│   └── superpowers/specs/    ← Design specs
├── PreConfig.js              ← Override: DRAWIO_BASE_URL, sync mode
├── etc/                      ← Upstream (unchanged)
├── .gitignore                ← Ignore node_modules/, diagrams/*.autosave
└── README.md                 ← Fork documentation
```

## REST API Specification

### Convention
- Server runs on a single port: `http://localhost:3000`
- Serves drawio static files AND the REST API on the same port
- Base URL: `http://localhost:3000/api`
- Request body: `application/json`
- Response: `application/json` with `{ success: true, data: ... }` or `{ success: false, error: "..." }`
- Shape IDs are returned as strings on creation (e.g. `"shape:resistor_r1"`)

### 1. Diagram Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/diagrams` | List all `.drawio` files |
| `POST` | `/api/diagrams` | Create new blank diagram |
| `GET` | `/api/diagrams/:name` | Get full diagram XML |
| `PUT` | `/api/diagrams/:name` | Overwrite diagram XML |
| `DELETE` | `/api/diagrams/:name` | Delete diagram |
| `GET` | `/api/diagrams/:name/list` | List all shapes (id, type, pos, size, label, style) |
| `GET` | `/api/watch/:name` | SSE endpoint — pushes "reload" on file changes |

**POST /api/diagrams** body:
```json
{
  "name": "tractor-power.drawio",
  "template": "blank"   // optional: "blank" (default) or "electrical"
}
```

### 2. Shape Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/diagrams/:name/shapes` | Add a shape |
| `PUT` | `/api/diagrams/:name/shapes/:id` | Update shape properties |
| `DELETE` | `/api/diagrams/:name/shapes/:id` | Remove a shape |
| `POST` | `/api/diagrams/:name/shapes/:id/move` | Move to new x,y |
| `POST` | `/api/diagrams/:name/shapes/:id/resize` | Resize to new w,h |
| `POST` | `/api/diagrams/:name/shapes/:id/label` | Set main label text |
| `POST` | `/api/diagrams/:name/shapes/:id/sub-label` | Set secondary text |
| `POST` | `/api/diagrams/:name/shapes/:id/style` | Full style override |
| `POST` | `/api/diagrams/:name/shapes/:id/fill` | Set fill color |
| `POST` | `/api/diagrams/:name/shapes/:id/stroke` | Set stroke color + width |
| `POST` | `/api/diagrams/:name/shapes/:id/text-style` | Set font properties |

**POST /api/diagrams/:name/shapes** body:
```json
{
  "type": "rectangle",     // rectangle, ellipse, rhombus, cylinder, hexagon, or drawio shape name
  "x": 100,
  "y": 200,
  "width": 120,
  "height": 60,
  "label": "Battery 12V",
  "style": {
    "fillColor": "#FFCC00",
    "strokeColor": "#000000",
    "strokeWidth": 2,
    "rounded": 1,
    "fontSize": 12,
    "fontColor": "#000000"
  }
}
```

**Style properties reference** (mxGraph style string format):
- `fillColor` — hex color (e.g. `#FF0000`), `none` for transparent
- `strokeColor` — hex color, `none` for no border
- `strokeWidth` — number (px)
- `gradientColor` — hex for gradient fill
- `rounded` — `0` or `1`
- `arcSize` — corner rounding radius
- `dashed` — `0` or `1`
- `dashPattern` — e.g. `3 3`
- `fontSize` — number
- `fontColor` — hex
- `fontStyle` — `0` normal, `1` bold, `2` italic, `3` bold+italic
- `align` — `left`, `center`, `right`
- `verticalAlign` — `top`, `middle`, `bottom`
- `shape` — drawio shape name (e.g. `mxgraph.electrical.basic_resistor`)
- `perimeter` — perimeter type (e.g. `rectanglePerimeter`, `ellipsePerimeter`)
- `html` — `0` or `1` (enable HTML label)
- `whiteSpace` — `wrap` for text wrapping
- `opacity` — 0–100
- `shadow` — `0` or `1`
- `flipH`, `flipV` — `0` or `1`
- `rotation` — degrees
- `container` — `0` or `1` (swimlane/container)
- `collapsible` — `0` or `1`
- `childLayout` — layout for children (e.g. `stackLayout`)
- `horizontal` — `0` or `1` for stack direction

### 3. Pinout Components

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/diagrams/:name/pinout` | Create a microcontroller/IC with pinout |
| `POST` | `/api/diagrams/:name/pinout/:id/pin` | Add a pin |
| `PUT` | `/api/diagrams/:name/pinout/:id/pin/:pinId` | Update a pin |
| `DELETE` | `/api/diagrams/:name/pinout/:id/pin/:pinId` | Remove a pin |

**POST /api/diagrams/:name/pinout** body:
```json
{
  "x": 100,
  "y": 200,
  "width": 200,
  "height": 300,
  "label": "MCU-NAME",
  "pins": [
    { "side": "left", "index": 1, "label": "VDD", "type": "power" },
    { "side": "left", "index": 2, "label": "PA0", "type": "gpio" },
    { "side": "right", "index": 1, "label": "PB0", "type": "gpio" },
    { "side": "top", "index": 1, "label": "RESET", "type": "input" },
    { "side": "bottom", "index": 1, "label": "GND", "type": "ground" }
  ]
}
```

Pin types and their default colors: `power` (#FF0000), `ground` (#000000), `gpio` (#00AA00), `input` (#0066FF), `output` (#FF8800), `analog` (#AA00FF), `custom` configurable.

### 4. Connections

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/diagrams/:name/connections` | Connect two shapes/pins |
| `DELETE` | `/api/diagrams/:name/connections/:id` | Remove a connection |
| `PUT` | `/api/diagrams/:name/connections/:id` | Update connection label/style |

**POST /api/diagrams/:name/connections** body:
```json
{
  "from": "shape:resistor_r1",
  "to": "shape:pinout_mcu/pin:pa0",
  "label": "3.3V",
  "style": {
    "strokeColor": "#FF0000",
    "strokeWidth": 2,
    "dashed": 0
  }
}
```

### 5. Grouping

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/diagrams/:name/groups` | Create a group from child shape IDs |
| `POST` | `/api/diagrams/:name/groups/:id/add` | Add shape to group |
| `POST` | `/api/diagrams/:name/groups/:id/remove` | Remove shape from group |
| `DELETE` | `/api/diagrams/:name/groups/:id` | Ungroup (keep children) |

### 6. Stencil Libraries

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/stencils` | List custom stencil libraries |
| `POST` | `/api/stencils` | Create a new stencil library |
| `GET` | `/api/stencils/:name` | Get stencil library XML |
| `PUT` | `/api/stencils/:name` | Update stencil library |
| `POST` | `/api/stencils/:name/shapes` | Add custom shape to library |
| `DELETE` | `/api/stencils/:name/shapes/:id` | Remove shape from library |
| `POST` | `/api/stencils/from-diagram` | Save a diagram shape as reusable stencil |
| `POST` | `/api/diagrams/:name/place-stencil` | Place a stencil shape onto the diagram |

### 7. Export

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/export/:name` | Export diagram (query: `?format=png` or `?format=svg`) |

## pi Skill Structure

### `.pi/skills/drawio/SKILL.md`

Project-scoped skill — only available inside the drawio folder. Provides:
- Setup instructions (start the server, open browser)
- Links to the full API reference
- Structured tools for the AI to call

### `.pi/skills/drawio/api-reference.md`

Complete reference the AI model reads to understand:
1. All REST endpoints with curl examples
2. mxGraph style string format documentation
3. Electrical diagram conventions (wire colors, voltage levels, ground symbols)
4. Common component patterns (relay with coil+contacts, microcontroller pinout, fuse block, etc.)
5. Troubleshooting guide

## Real-Time Updates (SSE Auto-Refresh)

When the AI modifies a diagram via the API:
1. Server writes the modified `.drawio` file to `server/diagrams/`
2. `chokidar` file watcher detects the change
3. SSE endpoint `/api/watch/:name` pushes a `{"event": "reload", "file": "..."}` message
4. Browser page (with embedded SSE listener) auto-refreshes

**Mechanism:** The server injects a small `<script>` tag into the served `index.html` that:
- Opens an SSE connection to `/api/watch/:name` for the currently open diagram
- On receiving a `reload` event, calls `window.location.reload()`
- The currently open diagram name is determined from the URL hash or a cookie

**PreConfig.js overrides** needed:
- `window.DRAWIO_BASE_URL = 'http://localhost:3000'`
- `urlParams['sync'] = 'manual'` (already set)
- `urlParams['local'] = '1'` — enable local file operations

## Electrical Conventions (for LLM context)

Color coding to be documented in the API reference:
- **Red** (#FF0000): Power/positive/VDC
- **Black** (#000000): Ground/negative
- **Blue** (#0066FF): Signal/control
- **Orange** (#FF8800): Output/driven
- **Green** (#00AA00): Input/sensor
- **Yellow** (#FFCC00): Caution/warning
- **Purple** (#AA00FF): Analog/special

## Device Setup Guide

A `docs/SETUP-GUIDE.md` will cover:
1. Prerequisites: Node.js 18+, git, pi code
2. Clone the fork from GitHub
3. `cd server && npm install`
4. `node server.js` to start
5. Open `http://localhost:3000` in browser
6. `pi code` in the project folder to get AI tools
7. Syncing diagrams across devices (git, USB, or cloud sync)

## Implementation Order

1. **Fork & clone** — Fork jgraph/drawio on GitHub, clone into local folder
2. **Server scaffolding** — package.json, Express server, static file serving
3. **File manager** — Save/load .drawio files, chokidar watcher, SSE
4. **XML builder** — mxGraph XML generation library
5. **Shape API routes** — CRUD for shapes, move, resize, label, style
6. **Connection API routes** — Connect shapes, style edges
7. **Grouping API routes** — Group/ungroup
8. **Pinout API routes** — Multi-pin component creation
9. **Stencil API routes** — Custom library management
10. **Export API** — PNG/SVG via drawio export
11. **pi skill** — SKILL.md + api-reference.md
12. **Setup guide** — docs/SETUP-GUIDE.md
13. **Integration test** — End-to-end: create diagram via API, view in browser, AI modifies