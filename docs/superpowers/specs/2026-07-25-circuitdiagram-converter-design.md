# Design Spec: CircuitDiagram Component Converter for drawio

**Date:** 2026-07-25
**Status:** Approved

## Overview

Convert all components from [circuitdiagram/components](https://github.com/circuitdiagram/components) into drawio-compatible stencil libraries, organized by electrical engineering category. This replaces drawio's basic electrical shapes with a much higher-quality, standards-compliant component library.

## Source Format (circuitdiagram XML)

Each component is an XML file with:
- `<declaration>` — metadata (name, version, author), properties (enum/string/decimal), and configurations (variant presets)
- `<connections>` — pin/terminal definitions with autorotate rules. Each `<connection>` has a name, start/end vector coordinates, and edge type (start/end)
- `<render>` — SVG-like vector instructions: `<rect>`, `<line>`, `<path>`, `<ellipse>`, `<text>`, `<group>`, `<g>` (conditional groups). Coordinates use named anchors (`_Start`, `_End`, `_Middle`) and arithmetic offsets.

## Target Format (drawio Stencil Library)

Each library is a single `.xml` file that drawio recognizes as a stencil:
```xml
<mxlibrary>
  [{"xml": "&lt;mxGraphModel&gt;...&lt;/mxGraphModel&gt;", "w":160, "h":160, "title": "Component Name"}]
</mxlibrary>
```

Each entry contains a compressed or inline mxGraphModel with one or more mxCells representing the component graphic plus its connection points (small pin shapes).

## Component Categories (8 Libraries)

| Library File | Category | Example Components | Count (~) |
|---|---|---|---|
| `eai-passive.xml` | Passive Components | resistor (IEC/US), capacitor, inductor, transformer, crystal, wire, bus, connector | ~15 |
| `eai-semiconductor.xml` | Semiconductors | diode, zener, transistor (NPN/PNP), thyristor, triac, op-amp, phototransistor | ~12 |
| `eai-switching.xml` | Switching & Protection | switch (SPST/SPDT), relay, contactor, fuse, solid-state relay, reed switch | ~13 |
| `eai-power.xml` | Power & Sources | ac/dc converter, voltage regulator, generator, source (battery/DC/AC), bridge rectifier, ground, meter | ~12 |
| `eai-ic.xml` | IC & Dev Boards | Arduino (Uno/Mega/Nano/Leonardo), ESP32, Raspberry Pi, NodeMCU, Atmega328, Pico, QtPy, DFRobot DFPlayer | ~18 |
| `eai-output.xml` | Output & Actuators | motor, stepper motor, servo motor, speaker, buzzer, lamp, heater, pump, 7-segment, HD44780 LCD, RGB LED, LCD driver | ~12 |
| `eai-logic.xml` | Logic & Digital | AND/OR/NOT/NAND/NOR/XOR gates (2 and 3 input), D/JK/T flip-flops, multiplexer, demultiplexer, counter, adder, buffer | ~14 |
| `eai-sensors.xml` | Sensors & Misc | hall effect, IR sensor, ultrasonic, phototransistor, microphone, antenna, reed switch, real-time clock, oscillator, signal generator | ~10 |

## Converter Design: `server/lib/component-converter.js`

### Phase 1: Parse circuitdiagram XML

Parse the source XML to extract:
- Component name and metadata
- Connection definitions (pin names, positions, edges)
- Render instructions (shape elements with coordinates)
- Property defaults (for text display, resistance values, etc.)

### Phase 2: Map to drawio mxCells

| circuitdiagram element | drawio equivalent |
|---|---|
| `<rect x y width height>` | `shape=rectangle` with geometry |
| `<ellipse rx ry>` | `shape=ellipse` with geometry |
| `<line start end>` (render) | `shape=line` vertex or edge cell |
| `<path start data>` | `shape=mxgraph.basic.path` with points |
| `<text value align>` | Vertex cell with `value` attribute |
| `<g conditions>` | Flattened — all children placed unconditionally (can't express conditionals in stencils) |
| `<connection name edge>` | Small 4x4 pin vertex at endpoint, with the pin name as label |

### Phase 3: Coordinate Transformation

circuitdiagram uses a relative coordinate system with named anchors:
- `_Start` = top-left of component
- `_End` = bottom-right of component
- `_Middle` = center
- Offsets: `_Middle-20x` = 20px left of center, `_Middle+10y` = 10px down from center

The converter translates these to absolute drawio coordinates (x, y, width, height) based on a bounding box computed from all render elements.

### Phase 4: Output Stencil XML

For each component, produce an entry in the stencil library JSON format that drawio recognizes.

### Phase 5: Component Configurations

Many circuitdiagram components have multiple configurations (e.g., resistor has IEC style, US style, potentiometer, thermistor, LDR). Each configuration becomes its own stencil entry with the variant name.

## Files Created

- `server/lib/component-converter.js` — The converter module
  - `convertComponent(xmlString)` → `{ entries: [{xml, w, h, title}] }`
  - `convertAll(sourceDir, outputDir)` → batch converts and writes stencil files
- `server/lib/circuitdiagram-components/` — Cloned copy of source repo (MIT licensed)
- `e-ai-designs/stencils/eai-passive.xml` — Output stencil files (committed)
- `e-ai-designs/stencils/eai-semiconductor.xml`
- `e-ai-designs/stencils/eai-switching.xml`
- `e-ai-designs/stencils/eai-power.xml`
- `e-ai-designs/stencils/eai-ic.xml`
- `e-ai-designs/stencils/eai-output.xml`
- `e-ai-designs/stencils/eai-logic.xml`
- `e-ai-designs/stencils/eai-sensors.xml`

## Testing Plan

After conversion:
1. Create a test diagram for each category via API: `POST /api/diagrams`
2. Place each component into the diagram using stencil placement
3. Add a power source and load component to verify connections
4. Open each test diagram in the browser (`/editor`) to visually verify
5. Flag components that render poorly → fix in converter or hand-tune the output XML

## Non-Goals (for future phases)

- Adding connection points (pin definitions) to drawio shapes — v1 uses simple shapes
- Supporting circuitdiagram's autorotate rules — components are placed in default orientation
- Property-based dynamic rendering (resistance values, labeling) — labels are static based on defaults
- Pulling downstream updates from circuitdiagram/components — manual re-conversion for now

## Dependencies

- Node.js (already in project)
- No new npm packages needed (uses built-in fs, path, xml parsing via regex)
- Circuit Diagram Components repo (MIT license — compatible with our Apache 2.0 licensed fork)
