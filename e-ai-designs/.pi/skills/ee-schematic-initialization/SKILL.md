---
name: ee-schematic-initialization
description: Use when starting a new electrical engineering schematic project, designing wiring diagrams for vehicles/machinery/power systems, or any time a professional multi-page electrical schematic document with IEEE-compliant formatting is needed.
---

# EE Schematic Project Initialization Skill

## Overview

Initialize professional multi-page electrical engineering schematic projects in drawio that follow IEEE-influenced practices and industrial documentation standards. This skill covers the complete project structure — cover page, title blocks, revision tracking, layer organization, and schematic sheet management.

## When to Use

Use this skill when:
- Starting a new electrical system design (vehicle wiring, power distribution, control panel, industrial machine)
- The project needs formal documentation with revision tracking
- Multiple schematic sheets will be created
- Following engineering documentation standards (IEEE, IEC, industrial)

Do NOT use for:
- Quick one-off sketches without formal documentation needs
- Non-electrical diagrams
- Existing projects being edited (only for initialization)

## Prerequisites

Before invoking, collect these parameters from the user:

| Parameter | Required | Example |
|-----------|----------|---------|
| Project Name | Yes | "Electric Tractor Power Distribution" |
| Drawing Number Prefix | Yes | "TRAC-ELEC" |
| Author / Drawn By | Yes | "M. Keller" |
| Company / Owner | Yes | "AgriPower Systems" |
| Page Size | No (default A3 landscape) | "A3", "ANSI_D", "Tabloid" |
| Number of initial schematic sheets | No (default 1) | 3 |
| Applicable Standards | No | "IEEE 315, IEC 60617, NFPA 70" |

## Page Sizes (drawio format)

| Name | Width | Height |
|------|-------|--------|
| A3 Landscape (default) | 1654 | 1169 |
| A2 Landscape | 2339 | 1654 |
| Tabloid (11×17") | 1684 | 1100 |
| ANSI D | 2592 | 1728 |

## Step-by-Step Procedure

### Step 1: Create the Project File

Create a new .drawio file via the API:

```bash
POST /api/diagrams
Body: { "name": "PROJECT-NAME.drawio" }
```

### Step 2: Build Page 1 — Cover / Title Page

The cover page is a single drawio page with these elements, built from standard shapes (rectangles, text, lines).

**2a. Outer border frame**

A rectangle at x=20, y=20, width=pageW-40, height=pageH-40 with:
- Style: `fillColor=none;strokeColor=#000000;strokeWidth=2`

**2b. Title Block** (centered, upper half of page)

Large block with:

```
┌─────────────────────────────────────────────────┐
│                                                 │
│         [PROJECT NAME]                          │
│         Electric Tractor Power Distribution     │
│                                                 │
│         Document Number: TRAC-ELEC-001          │
│         Revision: —                             │
│         Status: WORKING                         │
│                                                 │
│         Owner: AgriPower Systems                │
│         Author: M. Keller                       │
│         Date: [CURRENT DATE]                    │
│                                                 │
└─────────────────────────────────────────────────┘
```

Style: `fillColor=#FFFFFF;strokeColor=#000000;strokeWidth=2;align=center;verticalAlign=middle;fontSize=14;fontStyle=1;whiteSpace=wrap;`

**2c. Revision History Table** (lower-left, ~40% of page width)

A table block with these columns:
| Revision | Date | Description of Change | Author |
|----------|------|----------------------|--------|
| —        | [DATE] | Initial Release      | [AUTHOR] |

Build as a grouped shape with header row (darker fill) and data row (white fill). Use `whiteSpace=wrap;html=1;` for multi-line cells.

**2d. Sheet Index** (lower-right, ~50% of page width)

| Sheet | Title | Revision |
|-------|-------|----------|
| 1     | Cover Page | — |
| 2     | Schematic — System Overview | — |

**2e. Standards & Notes Block** (if provided)

Small block below the revision table or sheet index listing applicable standards.

### Step 3: Create Schematic Sheet Template (Page 2+)

**3a. Border Frame** (same as cover page)

**3b. Title Block** (bottom-right corner, 300×120px area)

Must contain these fields in a compact grid:

```
┌──────────────────────────────────────┐
│ Project: [PROJECT NAME]              │
│ Title: [DRAWING TITLE]              │
│ Drawing No: [PREFIX-###]  Rev: [A]  │
│ Drawn: [AUTHOR]    Date: [DATE]     │
│ Checked: ________  Appr: ________   │
│ Sheet: [N of M]    Scale: NTS       │
└──────────────────────────────────────┘
```

Title block position: x = pageW - 340, y = pageH - 140

Build as:
- Outer rectangle: `fillColor=#FFFFFF;strokeColor=#000000;strokeWidth=2`
- Inner dividing lines: thin rectangles (1px height for horizontal, 1px width for vertical)
- Text fields: individual text shapes positioned within cells
- Group all title block elements together for easy duplication

**3c. Layer Structure**

Create these layers in each schematic sheet. For drawio, layers are simply visual separation — use clear labeling and consistent z-ordering:

| Layer | Draw Order | Purpose |
|-------|-----------|---------|
| Title Block | Top (locked in editor) | Title block and border frame |
| Annotations | Upper-middle | Notes, callouts, text labels |
| Control / Signal | Middle | Low-voltage control wiring, signal paths |
| Power | Lower-middle | High-voltage power distribution |
| Dimensions | Bottom | Reference dimensions if needed |

To implement layers in drawio: use groups and a consistent naming convention. Mark title block cells with a `locked=1` style property to prevent accidental edits.

### Step 4: Create the Initial Schematic Sheet

Add a blank schematic sheet (page 2) with:
- Border frame
- Title block (copy from template, update sheet number to "2 of [N]")
- A large text placeholder in the center: "[PLACE SCHEMATIC HERE]"

### Step 5: Save and Verify

- Save the diagram via the API or browser Save button
- Open in the browser to verify cover page and schematic sheet render correctly
- Check that title block is properly positioned and readable

## Guidelines During Editing

### Connection Standards

- **Default connections**: Use plain lines without arrows (`endArrow=none;startArrow=none`)
- **Wire routing**: Use orthogonal edge style with right-angle bends only. No diagonal lines
- **Wire colors** (follow electrical-wiring-standards skill):
  - Red (#FF0000): HV power (48V+)
  - Black (#000000): Ground
  - Blue (#0066FF): LV power / control signals
  - Orange (#FF8800): Outputs / loads
  - Green (#00AA00): Inputs / sensors
  - Purple (#AA00FF): Analog / CAN bus
- **Wire labels**: Every connection must have a label (voltage, signal name, or function)

### Component Placement

- **Grid alignment**: Use 20px grid. All coordinates should be multiples of 20
- **Power flow**: Top-to-bottom. Place power sources at top, loads at bottom
- **Signal flow**: Left-to-right. Place inputs on left, processing in middle, outputs on right
- **Consistent sizing**: Same-type components get identical dimensions
- **Clear separation**: Minimum 80px gap between power and control sections

### Symbol Usage

- **Passive components** (resistors, capacitors, inductors): Use drawio's built-in Electrical shapes via the `shape=` style property
- **ICs / microcontrollers**: Use the eai-ic stencil library (auto-loaded in editor)
- **Custom symbols**: If a required symbol doesn't exist, create it using basic shapes and group them
- **Ground symbols**: Always include. Use `mxgraph.electrical.signal_sources.ground` for standard ground

### Revision Management

- When making significant changes to a schematic sheet, increment the revision on that sheet's title block
- Add an entry to the cover page revision history table
- Update the sheet index if sheets are added or removed
- Minor edits (wire routing, label fixes) that don't change the circuit function do NOT require a new revision

### Drawing Number Scheme

Format: `[PREFIX]-[CATEGORY]-[NNN]`

Examples:
- `TRAC-ELEC-001` — Main power distribution schematic
- `TRAC-ELEC-002` — Control system schematic  
- `TRAC-ELEC-003` — Sensor interface schematic

Categories: ELEC (electrical), CTRL (control), COMM (communication), POWER (power distribution)

## Template: Complete Cover Page XML Skeleton

When building the cover page via the API, use this structure:

```
Page 1 (Cover):
  - Border frame: rect, x=20, y=20, w=pageW-40, h=pageH-40
  - Title block: grouped rects + text
    - Project name: fontSize=22, bold, centered
    - Doc number: fontSize=12
    - Status: fontSize=12
    - Owner/Author/Date: fontSize=11
  - Revision table: grouped rects, header row has darker fill
  - Sheet index: grouped rects, same format
  - Standards block (if applicable)
```

## Template: Schematic Sheet Title Block Dimensions

```
Title block outer: 300w × 110h, at position (pageW-320, pageH-130)
Row heights: 22, 22, 22, 22, 22
Column widths: 150, 150

Cells (row, col):
  Row 0: "Project: [NAME]" (span both cols, fontSize=10, bold)
  Row 1: "Title: [TITLE]" (col0), "Drawing No: [NO]" (col1)
  Row 2: "Drawn: [NAME]" (col0), "Date: [DATE]" (col1)
  Row 3: "Checked: [NAME]" (col0), "Appr: [NAME]" (col1)
  Row 4: "Sheet: [N] of [M]" (col0), "Scale: NTS" (col1)
```

## Checklist After Initialization

- [ ] Cover page has: project name, doc number, status, author, date
- [ ] Revision history has initial entry row
- [ ] Sheet index lists cover page + all schematic sheets
- [ ] Each schematic sheet has title block with unique sheet number
- [ ] Title blocks are consistent across all pages
- [ ] All text is sans-serif (Helvetica/Arial), readable sizes (10pt min for body, 14pt+ for titles)
- [ ] Page size is consistent across all sheets
- [ ] Border frames are present on all pages
- [ ] File saved and verified in browser
