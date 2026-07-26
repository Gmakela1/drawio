---
name: drawio-layout
description: Use when organizing drawio diagrams — placing components, grouping related elements, laying out connection paths, and maintaining consistent visual structure.
---

# drawio Layout & Organization

## Overview

A well-organized diagram is readable, maintainable, and communicates intent clearly. Random placement creates confusion. Always plan the layout before adding components, and use drawio's grouping and alignment features to keep things organized.

## Layout Planning

### Before Placing Components

1. **Identify the flow direction** — Power flows top-to-bottom, signals flow left-to-right
2. **Sketch logical groups** — Power section, control section, loads, sensors
3. **Plan whitespace** — Leave room for labels, connections, and future additions
4. **Set a grid** — Align all components to a consistent grid (e.g., multiples of 20px)

### Standard Grid Sizes

| Component Type | Grid Multiple | Example |
|----------------|---------------|---------|
| Power components | 20px | Battery (120×60), Fuse (80×40) |
| Signal/control | 10px | VCU (200×260), sensors (60×30) |
| Connectors/pins | 5px | Pin headers, terminal blocks |
| Connections | Follow grid | Route wires on grid lines |

## Component Placement Rules

### When Adding Shapes
- **Align to grid** — Every shape position should be a multiple of your grid size
- **Consistent sizing** — Same-type components get the same dimensions:
  - Power components: 120×60 or 140×80
  - Fuses: 80×40
  - Contactor/relay: 100×50
  - DC-DC: 140×70
  - Motor: 120×80
  - VCU/ECU: 200×260
- **Label alignment** — Center-align labels in shapes, left-align for text-only elements

### Connection Routing
- **Use orthogonal routing** — Draw connections as horizontal and vertical lines only (no diagonals)
- **Route around shapes** — Don't run connections through other components
- **Label connections** — Every connection should have a label (voltage, signal name, or purpose)
- **Consistent spacing** — Parallel connections should be evenly spaced (20px apart)

## Grouping & Organization

### When to Group
- Related components that form a subsystem (e.g., all motor drive components)
- Components that should move together during layout changes
- Subsystems that share a common function (power section, control section, sensors)

### Grouping Best Practices
- Give each group a descriptive label: "Power Section", "Control Logic", "Sensors"
- Use groups to collapse complex subsystems during editing
- Nest groups for hierarchical organization: `Vehicle → Power System → HV Traction`
- Group size should match the logical boundary of the subsystem

### Group Naming Convention
```
[System] → [Subsystem] → [Component]
```
Example: `Tractor → Power Distribution → HV Traction → Motor Controller`

## Connection Organization

### Labeling Connections
- Every connection needs a label that describes what it carries
- Power connections: voltage + purpose — "48V HV", "12V Control", "GND"
- Signal connections: signal name — "BMS_OK", "THR", "CAN_H"
- Use consistent font size (11px for connections, 12-14px for components)

### Connection Style Standards
| Connection Type | Style | Example |
|----------------|-------|---------|
| HV Power (48V+) | 3px solid red | `strokeColor=#FF0000;strokeWidth=3` |
| LV Power (12V/24V) | 2px solid blue | `strokeColor=#0066FF;strokeWidth=2` |
| Ground | 2px solid black | `strokeColor=#000000;strokeWidth=2` |
| Control signal | 2px solid blue | `strokeColor=#0066FF;strokeWidth=2` |
| Sensor input | 2px dashed green | `strokeColor=#00AA00;strokeWidth=2;dashed=1` |
| Communication | 1px solid purple | `strokeColor=#AA00FF;strokeWidth=1` |
| 3-Phase motor | 2px solid black | `strokeColor=#000000;strokeWidth=2` |

## Diagram Maintenance

### When Iterating
- **After adding 3+ components** → Re-run alignment, check spacing
- **After adding 5+ connections** → Check for overlaps, re-route if needed
- **Before saving** → Verify all labels are present and consistent
- **When adding a new section** → Place it on the right or below existing content, not in the middle

### Version Tracking
- Use "Save As" with version numbers for major revisions: `tractor-power-v2.drawio`
- Keep a changelog in the diagram or a separate document
- Don't delete old versions until the new one is verified

### Common Layout Mistakes
- Placing components at random coordinates (always use grid alignment)
- Running connections through other components (route around)
- Inconsistent label font sizes (standardize on 12px body, 14px titles)
- Overlapping connection lines (re-route or reposition)
- No margins around the diagram edge (leave 30px minimum)
- Mixing HV and LV components without clear separation
- Groups that are too large (more than 8-10 components per group)
- No legend for new symbols or colors

## Checklist Before Finalizing a Diagram

- [ ] All components aligned to grid
- [ ] Consistent sizing for same-type components
- [ ] All connections labeled with voltage/signal name
- [ ] Wire colors follow the electrical wiring standards
- [ ] No overlapping connections
- [ ] Logical groups are properly grouped
- [ ] Each group has a descriptive label
- [ ] Ground symbols present on all ground circuits
- [ ] Fuses present on all power inputs
- [ ] Legend present for any non-standard colors/symbols
- [ ] Diagram title at top
- [ ] Margins around all content (30px minimum)
- [ ] Version noted in filename or diagram