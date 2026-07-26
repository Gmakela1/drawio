---
name: drawio
description: Create, edit, and design electrical/power distribution diagrams using the drawio API. Use when working with .drawio files or diagramming tasks.
---

# drawio Diagramming Skill

## Setup

Ensure the Node.js server is running in the drawio project root:

```bash
cd server && node server.js
```

Open http://localhost:3000 in your browser to see the drawio editor.

## How to Use

Call the REST API at `http://localhost:3000/api/...` to create and modify diagrams.
All diagrams are stored in the `diagrams/` folder at the project root.

## Quick Start

1. Start the server
2. Open the browser
3. Create a diagram via API
4. Add shapes, connections, and styles
5. Refresh the browser to see changes (or SSE auto-refresh handles it)

## Full API Reference

See [api-reference.md](api-reference.md) for all endpoints, style docs, and examples.

## Related Skills

These skills work alongside the drawio API to produce professional wiring diagrams:

- **[electrical-wiring-standards](../electrical-wiring-standards/SKILL.md)** — Wire color conventions, component labeling, circuit design rules, and electrical engineering standards
- **[drawio-layout](../drawio-layout/SKILL.md)** — Diagram organization, component placement, connection routing, and layout best practices