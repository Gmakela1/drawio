---
name: design-electrical-schematic
description: Use after a project has been initialized with init-electrical-schematic-project, whenever adding, modifying, or reviewing any circuit, component, wire, or annotation. Also use when performing design review or enforcing standards compliance on existing sheets.
---

# Design Electrical Schematic Content (Standards-Compliant)

## Overview

Adds, modifies, or reviews electrical schematic content inside an already-initialized draw.io project while strictly enforcing IEEE 315-1975 graphic symbols & reference designators, IEEE C37.2 device function numbers, and ISO 7200 revision/title-block discipline. This skill is the ongoing design companion to `init-electrical-schematic-project`.

## When to Use

- After a project has been initialized with `init-electrical-schematic-project`
- Whenever the user asks to draw, add, change, or check any circuit, component, wire, or annotation
- When performing a design review or enforcing standards compliance on existing sheets

## Prerequisites

- The draw.io file must already contain:
  - Cover page with revision history
  - Locked title block on every schematic sheet
  - Layers: Title Block (locked), Power, Control, Annotations
- Governing standards already declared on the cover page (IEEE 315 + C37.2 + ISO 7200)
- The `electrical-wiring-standards` skill must be referenced for wire color conventions (see Related Skills below)

## Related Skills

- **[electrical-wiring-standards](../electrical-wiring-standards/SKILL.md)** — Wire color conventions, component labeling, and circuit design rules (must be referenced for all wire color decisions)
- **[init-electrical-schematic-project](../init-electrical-schematic-project/SKILL.md)** — The companion skill that initializes the project structure this skill operates on
- **[drawio-layout](../drawio-layout/SKILL.md)** — Diagram organization, component placement, and connection routing
- **[drawio-ic-builder](../drawio-ic-builder/SKILL.md)** — Creating IC/microcontroller/motor controller components with pinouts

## Core Rules the Agent Must Enforce on Every Action

### 1. Symbol Style (IEEE 315-1975)

- Use only IEEE 315-1975 graphic symbols
- Connection points of every symbol must land on the modular grid (20px increments)
- Never mix pure IEC 60617 symbols unless the cover page explicitly allows it and a legend is present
- Qualifying symbols (polarity, adjustability, direction of flow, kind of current, shielding, etc.) must be applied correctly when required

### 2. Reference Designators (IEEE 315 class letters)

Every component must receive a unique reference designator using the official class letter + sequential number:

| Class | Device Type | Example |
|-------|-------------|---------|
| R | Resistor | R1, R12 |
| C | Capacitor | C1, C4 |
| L | Inductor / Reactor | L1 |
| Q | Transistor | Q1 |
| D / CR | Diode | D1, CR1 |
| U | Integrated circuit | U1 |
| F | Fuse | F1 |
| K | Contactor / Relay (power) | K1, K2 |
| M | Motor | M1 |
| S / SW | Switch | S1, SW1 |
| T | Transformer | T1 |
| BAT / BT | Battery | BAT1 |
| X | Terminal / connector | X1 |
| E | Ground / Frame | E1 |
| P | Plug / Connector | P1 |
| DS | Display / Indicator | DS1 |
| LS | Limit Switch | LS1 |
| PS | Pressure Switch | PS1 |
| TS | Temperature Switch | TS1 |

- Numbers must be sequential and unique across the entire project (or per sheet if the user explicitly requests sheet-local numbering)
- Never invent non-standard prefixes

### 3. Device Function Numbers (IEEE C37.2-2008)

- Protective, control, and switching devices must also carry the correct IEEE C37.2 function number next to (or inside) the symbol
- Common numbers for this project type:
  - **27** = Undervoltage
  - **49** = Thermal overload
  - **50** = Instantaneous overcurrent
  - **51** = Time overcurrent
  - **52** = AC circuit breaker / main contactor
  - **59** = Overvoltage
  - **86** = Lockout relay
  - **87** = Differential relay
  - **94** = Tripping relay
  - **21** = Distance relay
  - **32** = Directional power
- Place the number in a circle or square adjacent to the device
- Use prefixes/suffixes only as defined in C37.2 when greater specificity is required

### 4. Layer Discipline

- Power circuits → Power layer
- Control / signal / logic → Control layer
- Notes, balloons, revision clouds, text call-outs → Annotations layer
- Never draw on the locked Title Block layer

### 5. Wire & Connection Rules

- Wires must connect only at the defined connection points of IEEE 315 symbols
- Maintain clear visual separation between power and control circuits
- Use consistent line weights and styles (power heavier than control if desired)
- Crossings that are not connected must be clearly indicated (bridge or gap per project convention)
- Follow wire color conventions from the `electrical-wiring-standards` skill:
  - Red (#FF0000): HV power (48V+)
  - Black (#000000): Ground
  - Blue (#0066FF): LV power / control signals
  - Orange (#FF8800): Outputs / loads
  - Green (#00AA00): Inputs / sensors
  - Purple (#AA00FF): Analog / CAN bus
- All connections must have a label (voltage, signal name, or function)
- Use orthogonal edge style with right-angle bends only — no diagonal lines

### 6. Revision Control (ISO 7200)

Any of the following triggers a formal revision:
- Adding or removing a major component or circuit
- Changing a protective device function or rating
- Restructuring sheet organization
- Changing the governing symbol set

When a revision is required the agent must:
1. Increment the revision index (A → B → C…; avoid I and O)
2. Update the Date of issue on the affected sheet(s)
3. Add a new row to the Revision History table on the cover page
4. Update the Sheet List if pages were added or titles changed

### 7. Title Block Integrity

- The locked title block on every sheet must remain correct at all times
- Sheet number and total number of sheets must stay accurate
- Creator and Approval person fields are updated only when the agent is explicitly told a new person is responsible

## Step-by-Step Procedure the Agent Must Follow

1. Confirm the project was initialized with the companion init skill
2. Identify which sheet(s) will be affected
3. Place or modify symbols using only IEEE 315 forms
4. Assign correct reference designators (class letter + number)
5. Add IEEE C37.2 device numbers where applicable
6. Route wires on the correct layer
7. Add any necessary annotations on the Annotations layer
8. If the change is major → execute the full revision-control sequence above
9. Verify that the title block still shows the correct sheet number, revision, and date
10. Report back a short summary of what was drawn/changed and whether a revision was issued

## Parameters the Agent May Collect

- target_sheet (page number or title)
- components_to_add / change_description
- whether this is a major change (triggers revision)
- any special numbering preference (project-wide vs sheet-local)

## Output the Agent Must Produce

- Updated .drawio XML (or precise edit instructions)
- Confirmation that all symbols, designators, and device numbers comply with IEEE 315 + C37.2
- Updated revision history on the cover page if a revision was issued
- Short compliance statement: "All new content follows IEEE 315-1975, IEEE C37.2-2008, and ISO 7200 revision rules."

## Example Invocation

User: "On the Power System sheet, add the main battery pack, contactor, fuse, and motor with proper protection."

Agent:
- Places IEEE 315 symbols for BAT, F, K (52), M
- Assigns BAT1, F1, K1, M1
- Adds device function 52 next to the contactor
- Draws on the Power layer
- Because this is a major addition, issues revision B, updates date and cover-page history
- Returns the updated file with a compliance note

## Checklist After Each Design Action

- [ ] All symbols use IEEE 315-1975 forms
- [ ] Every component has a unique reference designator
- [ ] Protective devices have IEEE C37.2 function numbers
- [ ] Wires are on the correct layer (Power, Control, or Annotations)
- [ ] Wire colors follow electrical-wiring-standards conventions
- [ ] Title block is intact and shows correct sheet number + revision
- [ ] Revision history updated on cover page if change was major
- [ ] Sheet list updated if sheets were added or renamed
- [ ] Short compliance statement provided