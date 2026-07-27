---
name: init-electrical-schematic-project
description: Use when starting any new electrical system design (power, control, vehicle conversion, industrial) that needs a professional, IEEE/ISO-compliant schematic set. Before any schematic content is drawn.
---

# Initialize Professional Electrical Schematic Project in draw.io

## Overview

Creates a complete, standards-compliant multi-page draw.io project for electrical system design. The project follows ISO 7200 title-block rules, IEEE 315 graphic symbols and reference designators, and IEEE C37.2 device function numbers. It produces a cover page with revision history plus schematic sheets that already contain a locked, professional title block.

## When to Use

- Starting any new electrical system design (power, control, vehicle conversion, industrial, etc.)
- When the user requests a professional, IEEE/ISO-compliant schematic set
- Before any schematic content is drawn

## Prerequisites

Collect these parameters from the user:

| Parameter | Required | Example |
|-----------|----------|---------|
| project_name | Yes | "RK19 Tractor Conversion" |
| legal_owner | Yes | "AgriPower Systems Inc." |
| drawing_number_prefix | Yes | "RK19-ELEC" |
| creator_name | Yes | "M. Keller" |
| approval_person | No | "J. Smith" |
| initial_status | No (default "In preparation") | "In preparation" |
| first_sheet_title | No (default "Power System") | "Power Distribution System" |

## Governing Standards (must be declared on cover page)

- **ISO 7200:2004** — Data fields in title blocks and document headers
- **IEEE Std 315-1975 (R1993)** — Graphic Symbols for Electrical and Electronics Diagrams (Including Reference Designation Letters)
- **IEEE Std C37.2-2008** — Electrical Power System Device Function Numbers, Acronyms, and Contact Designations

## Page Sizes

| Name | Width | Height |
|------|-------|--------|
| A3 Landscape (default) | 1654 | 1169 |
| Tabloid (11×17") | 1684 | 1100 |
| ANSI D | 2592 | 1728 |

## Step-by-Step Procedure

### 1. Create the Multi-Page .drawio File

Create a new .drawio file via the API:

```bash
POST /api/diagrams
Body: { "name": "PROJECT-NAME.drawio" }
```

### 2. Build the Cover Page (Page 1)

Must contain exactly these sections, built from shapes (rectangles, text, lines).

**2a. Outer border frame**

Rectangle at x=20, y=20, width=pageW-40, height=pageH-40.
Style: `fillColor=none;strokeColor=#000000;strokeWidth=2;`

**2b. Header block** (upper portion of page)

Centered block containing:
- Project name (fontSize=22, bold)
- Document title: "Electrical System Schematics"
- Legal owner (fontSize=12)
- Document number series (e.g., "RK19-ELEC-xxx")
- Status: "In preparation" / "Under approval" / "Released"

Style: `fillColor=#FFFFFF;strokeColor=#000000;strokeWidth=2;align=center;verticalAlign=middle;fontSize=14;fontStyle=1;whiteSpace=wrap;`

**2c. Revision History table** (mandatory, lower-left)

Columns in this order:
| Rev | Date of Issue | Description of Change | Author |
|-----|--------------|----------------------|--------|
| A   | [current date] | Initial Release | [creator] |

Use letter revisions (A, B, C…). Avoid I and O.
Build as grouped rectangles with header row (darker fill, `fillColor=#DDDDDD`) and data rows (white fill). Use `whiteSpace=wrap;html=1;` for multi-line cells.

**2d. Sheet List / Table of Contents** (lower-right)

| Sheet | Title | Revision |
|-------|-------|----------|
| 1     | Cover Page | — |
| 2     | [first_sheet_title] | — |

Automatically update this list whenever a new sheet is added.

**2e. Standards declaration**

A text block clearly stating:
> This project uses IEEE 315-1975 symbols and reference designators, IEEE C37.2 device function numbers, and ISO 7200 title-block fields.

### 3. Create the Title Block (apply to every schematic sheet)

Place a grouped, locked title block in the bottom-right corner of every schematic page.

**Mandatory fields (ISO 7200):**
- Legal owner
- Identification number (Drawing Number)
- Date of issue
- Segment/Sheet number (e.g., "2 of 5")
- Title
- Creator
- Approval person
- Document type ("Electrical Schematic")

**Strongly recommended fields:**
- Revision index
- Number of sheets
- Document status
- Responsible department (optional)
- Technical reference (optional)

**Layout:**
Total width ≈ 320px (proportional to A3 landscape). Position at x=pageW-340, y=pageH-140.
Compact block — maximum space remains for the schematic content.

```
┌──────────────────────────────────────────────┐
│ Owner: [LEGAL_OWNER]                         │
│ Title: [DRAWING_TITLE]                      │
│ Drawing No: [PREFIX-###]     Rev: [A]       │
│ Date: [DATE]   Doc Type: Electrical Schematic│
│ Creator: [NAME]   Approval: [NAME]          │
│ Sheet: [N] of [M]     Status: [STATUS]      │
└──────────────────────────────────────────────┘
```

Build as:
- Outer rectangle: `fillColor=#FFFFFF;strokeColor=#000000;strokeWidth=2;`
- Inner dividing lines: thin rectangles (1px height for horizontal, 1px width for vertical)
- Text fields: individual text shapes positioned within cells
- All title block cells must use `locked=1` in style to prevent accidental edits

### 4. Set Up Layers (on every schematic sheet)

Create and use these layers:

| Layer | Purpose |
|-------|---------|
| Title Block (locked) | Title block, border frame — never moved during editing |
| Power | High-voltage power distribution, HV components |
| Control / Signal | Low-voltage control wiring, signal paths, sensors |
| Annotations / Notes | Callouts, dimensions, test points, notes |
| Dimensions / References | Reference dimensions, grid markings (if needed) |

To implement layers in drawio: use a clear group naming convention. Title block cells are grouped and marked with `locked=1` in the style.

### 5. Symbol & Designator Rules

These rules must be enforced from the start of every project:

**Reference designators (IEEE 315 class letters):**
- **R** = Resistor
- **C** = Capacitor
- **L** = Inductor
- **Q** = Transistor
- **D** or **CR** = Diode
- **U** = Integrated circuit
- **F** = Fuse
- **K** = Contactor / Relay
- **M** = Motor
- **S** or **SW** = Switch
- **T** = Transformer
- **BAT** or **BT** = Battery
- **E** = Ground / Frame
- **P** = Plug / Connector
- **DS** = Display / Indicator
- **LS** = Limit Switch
- **PS** = Pressure Switch
- **TS** = Temperature Switch

**Device function numbers (IEEE C37.2):**
- **52** = AC circuit breaker
- **49** = Thermal relay
- **27** = Undervoltage relay
- **86** = Lockout relay
- **50** = Instantaneous overcurrent relay
- **51** = Time overcurrent relay
- **87** = Differential relay
- **21** = Distance relay
- **32** = Directional power relay
- **59** = Overvoltage relay

**Rules:**
- All graphic symbols shall follow IEEE 315-1975
- Every component gets a unique reference designator (e.g., R1, R2, C1, C2)
- Protective and control devices shall also carry the appropriate IEEE C37.2 device function number next to the symbol (e.g., "52" for a circuit breaker)
- Never mix IEEE 315 and pure IEC 60617 symbols without an explicit legend note on the cover page

### 6. Revision Control Rules

- Every major structural change requires:
  1. New revision letter (increment: A→B→C, skip I and O)
  2. New date of issue
  3. New row added to the cover-page revision history table
- The agent must update the sheet list on the cover page whenever a new schematic sheet is created
- Minor edits (wire routing, label fixes, repositioning) that don't change circuit function do NOT require a new revision

### 7. Output the Agent Must Produce

1. A complete, valid .drawio file via the API
2. Cover page fully populated with: header block, revision history table, sheet list, standards declaration
3. At least one schematic sheet with the locked title block already placed
4. All layers created on every sheet
5. A short note listing the three governing standards

### 8. Connection Standards

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

### 9. Component Placement Standards

- **Grid alignment**: Use 20px grid. All coordinates should be multiples of 20
- **Power flow**: Top-to-bottom. Place power sources at top, loads at bottom
- **Signal flow**: Left-to-right. Place inputs on left, processing in middle, outputs on right
- **Consistent sizing**: Same-type components get identical dimensions
- **Clear separation**: Minimum 80px gap between power and control sections

## Example Invocation

User: "Initialize a new electrical schematic project for the RK19 tractor conversion."

Agent collects:
- project_name: "RK19 Tractor Conversion"
- legal_owner: "AgriPower Systems Inc."
- drawing_number_prefix: "RK19-ELEC"
- creator_name: "M. Keller"
- approval_person: "J. Smith"
- first_sheet_title: "Power Distribution System"

Then produces:
- `RK19-Tractor-Conversion.drawio` with 2 pages
- Page 1: Cover page with revision history (Rev A initial entry), sheet list, IEEE/ISO standards declaration
- Page 2: Schematic sheet with locked ISO 7200 title block, correct layers, ready for content

## Checklist After Initialization

- [ ] Cover page has: project name, document title, legal owner, doc number series, status
- [ ] Revision history has initial entry (Rev A, date, "Initial Release", creator)
- [ ] Sheet list covers all pages
- [ ] Standards declaration present (ISO 7200, IEEE 315, IEEE C37.2)
- [ ] Each schematic sheet has locked title block with unique sheet number
- [ ] Title block has all mandatory ISO 7200 fields
- [ ] Layers created: Title Block (locked), Power, Control/Signal, Annotations, Dimensions
- [ ] All text is sans-serif, readable sizes (10pt body, 14pt+ titles)
- [ ] Page size consistent across all sheets
- [ ] Border frames present on all pages
- [ ] File saved and verified in browser