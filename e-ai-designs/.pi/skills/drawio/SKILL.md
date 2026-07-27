---
name: drawio
description: Create, edit, and design electrical/power distribution diagrams using the drawio API. Use when working with .drawio files or diagramming tasks.
---

# drawio Diagramming Skill

## Setup

Ensure the Node.js server is running in the drawio project root:

```bash
cd ~/vscode/drawio/server && node server.js
```

Open http://localhost:3000 in your browser to see the drawio editor.

## Project Structure

This skill runs from the `e-ai-designs/` project directory — your diagrams live here, separate from the drawio source code:

```
e-ai-designs/          ← Your AI workspace (pi code runs here)
├── diagrams/          ← Your .drawio files
├── stencils/          ← Custom component libraries
└── .pi/skills/        ← AI skills for electrical design
```

## How to Use

Call the REST API at `http://localhost:3000/api/...` to create and modify diagrams.
All diagrams are stored in the `e-ai-designs/diagrams/` folder.

## Quick Start

1. Start the server (from ~/vscode/drawio/server)
2. Open http://localhost:3000/editor in your browser
3. Create a diagram via API
4. Add shapes, connections, and styles
5. The browser updates automatically via SSE — no manual refresh needed

## Full API Reference

See [api-reference.md](api-reference.md) for all endpoints, style docs, and examples.

## Related Skills

These skills work alongside the drawio API to produce professional wiring diagrams:

- **[init-electrical-schematic-project](../init-electrical-schematic-project/SKILL.md)** — Initialize professional multi-page IEEE/ISO-compliant electrical schematic projects with cover pages, title blocks, revision tracking, and symbol/designator rules
- **[drawio-ic-builder](../drawio-ic-builder/SKILL.md)** — Create IC/microcontroller/motor controller components with pinouts, proper sizing, and label positioning for stencil libraries
- **[electrical-wiring-standards](../electrical-wiring-standards/SKILL.md)** — Wire color conventions, component labeling, circuit design rules, and electrical engineering standards
- **[drawio-layout](../drawio-layout/SKILL.md)** — Diagram organization, component placement, connection routing, and layout best practices