---
name: drawio-ic-builder
description: Use when creating integrated circuit (IC), microcontroller, motor controller, or any component with pinouts for drawio stencil libraries. Covers proper sizing, pin layout, label positioning, and visual style defaults.
---

# drawio IC/Pinout Component Builder

## Overview

When building a chip-style component (microcontroller, motor controller, IC, module) for drawio stencils, follow these conventions to produce consistent, readable schematic symbols.

## Default Dimensions & Spacing

```
Total component size:   280w × variable height (100 + pinsPerSide × 26)
Body margin:            45px from each edge
Pin spacing:            26px between pins
Body size:              190w × variable height (total - 90)
```

### Height Formula

```
totalHeight = 100 + Math.ceil(totalPins / 4) × 26
```

For a component with no side pins, use a minimum of 120px height.

## Body Style

```javascript
style = "rounded=1;fillColor=#FFFFFF;fontColor=#000000;strokeColor=#000000;strokeWidth=2;align=center;verticalAlign=middle;fontSize=12;fontStyle=1;whiteSpace=wrap;overflow=hidden;"
```

Key properties:
- **fillColor=#FFFFFF** — Light/white fill (never dark)
- **strokeColor=#000000** — Black outline
- **strokeWidth=2** — Thick enough to see clearly
- **verticalAlign=middle** — Name centered vertically in body
- **whiteSpace=wrap** — Long names wrap instead of overflowing
- **overflow=hidden** — Clips text that's too long
- **rounded=1** — Slightly rounded corners for IC appearance

## Pin Layout

### Lead Lines (external to body)

Each pin gets a 15px × 1px line extending from the body edge:

- **Left pins**: line from `(bodyX - 15, pinY)` to `(bodyX, pinY)`
- **Right pins**: line from `(bodyX + bodyW, pinY)` to `(bodyX + bodyW + 15, pinY)`
- **Top pins**: line from `(pinX, bodyY - 15)` to `(pinX, bodyY)`
- **Bottom pins**: line from `(pinX, bodyY + bodyH)` to `(pinX, bodyY + bodyH + 15)`

### Pin Labels (inside body)

All pin labels use `fontSize=7`, no fill, no stroke:

| Side | Alignment | X Position | Y Position | Size |
|------|-----------|------------|------------|------|
| Left | align=left | bodyX + 3 | pinY - 10 | 40 × 12 |
| Right | align=right | bodyX + bodyW - 43 | pinY - 10 | 40 × 12 |
| Top | align=center | pinX - 20 | bodyY - 2 | 40 × 12 |
| Bottom | align=center | pinX - 20 | bodyY + bodyH - 21 | 40 × 12 |

### Pin Y Coordinates (Left/Right)

For N pins on a side, evenly distribute within the body height:

```
pinY = bodyY + (bodyH / (N + 1)) × (pinIndex + 1)
```

### Pin X Coordinates (Top/Bottom)

```
pinX = bodyX + (bodyW / (N + 1)) × (pinIndex + 1)
```

## Expanding Grouped Pins

Labels like "D0-D7" or "A0-A5" must be split into individual pins:

```javascript
// Pattern: single letter prefix with range (e.g., D0-D7, A0-A5)
const match = label.match(/^([A-Z])(\d+)-\1(\d+)$/);
if (match && end > start && end - start < 20) {
    for (let i = start; i <= end; i++) {
        pins.push({ side, label: prefix + i });
    }
}
```

## Complete mxGraphModel Template

```xml
<?xml version="1.0" encoding="UTF-8"?>
<mxGraphModel>
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
    <!-- Body -->
    <mxCell id="2" parent="1" vertex="1" value="COMPONENT_NAME"
      style="rounded=1;fillColor=#FFFFFF;fontColor=#000000;strokeColor=#000000;strokeWidth=2;align=center;verticalAlign=middle;fontSize=12;fontStyle=1;whiteSpace=wrap;overflow=hidden;">
      <mxGeometry x="45" y="45" width="190" height="BODY_H" as="geometry"/>
    </mxCell>
    <!-- Pin lead lines and labels follow (id="3", id="4", ...) -->
  </root>
</mxGraphModel>
```

## Stencil Library JSON Format

```xml
<mxlibrary>
[{"xml":"&lt;?xml version=&quot;1.0&quot;...&gt;...","w":280,"h":256,"title":"Component Name"}]
</mxlibrary>
```

The XML inside the JSON string must be entity-encoded (`&lt;` for `<`, `&quot;` for `"`, `&gt;` for `>`, `&amp;` for `&`). Use this encoding pipeline:

```javascript
function buildStencilLibrary(entries) {
    const json = JSON.stringify(entries.map(e => ({ xml: e.xml, w: e.w, h: e.h, title: e.title })));
    return `<mxlibrary>${json.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}</mxlibrary>`;
}
```

## Common Pin Maps

These are reference pinouts for frequently-used boards:

### Arduino Uno
```
Left: D0, D1, D2, D3, D4, D5, D6, D7, AREF, GND, D13
Right: A0, A1, A2, A3, A4, A5, 3.3V, 5V, GND
Top: VIN
Bottom: RESET
```

### Arduino Nano
```
Left: D2, D3, D4, D5, D6, D7, D8, D9, D10, D11, D12, 3.3V
Right: A0, A1, A2, A3, A4, A5, A6, A7, 5V, GND
Top: VIN
Bottom: RST
```

### ESP32
```
Left: EN, GPIO36, GPIO39, GPIO34, GPIO35, GPIO32
Right: GPIO23, GPIO22, GPIO21, GPIO19, GPIO18, GPIO5
Top: 3.3V
Bottom: GND
```

### Raspberry Pi Pico
```
Left: GPIO0, GPIO1, GND, GPIO2, GPIO3, GPIO4
Right: GPIO28, GPIO27, GPIO26, RUN, GPIO22, GND
Top: VBUS
Bottom: 3.3V
```

## Checklist Before Finalizing

- [ ] Body: white fill (`#FFFFFF`), black border (`#000000`), 2px stroke
- [ ] Name: centered, bold, fontSize=12, wraps if long
- [ ] Pin labels: fontSize=7, inside body
- [ ] Left labels: align=left, x = bodyX+3, y = pinY-10
- [ ] Right labels: align=right, x = bodyX+bodyW-43, y = pinY-10
- [ ] Top labels: align=center, y = bodyY-2
- [ ] Bottom labels: align=center, y = bodyY+bodyH-21
- [ ] Pin spacing: 26px minimum
- [ ] Body margins: 45px from component edges
- [ ] Grouped pins (e.g., "D0-D7") expanded to individual pins
- [ ] Output file: `<mxlibrary>` with entity-encoded JSON
