# drawio API Reference (continued)

### Create library (continued)
`POST /api/stencils`
Body: `{ "name": "electric-tractor" }`

## mxGraph Style Reference

Key style properties for drawio shapes:

| Property | Example | Description |
|----------|---------|-------------|
| fillColor | #FF0000 | Fill color (hex or "none") |
| strokeColor | #000000 | Border color |
| strokeWidth | 2 | Border width in px |
| gradientColor | #FFFFFF | Gradient end color |
| rounded | 0 or 1 | Round corners |
| fontSize | 12 | Text size |
| fontColor | #000000 | Text color |
| fontStyle | 0, 1, 2, 3 | 0=normal, 1=bold, 2=italic, 3=bold+italic |
| align | left, center, right | Horizontal text align |
| verticalAlign | top, middle, bottom | Vertical text align |
| dashed | 0 or 1 | Dashed border |
| dashPattern | 3 3 | Dash pattern |
| shape | rectangle, ellipse, rhombus, etc. | Shape type |
| opacity | 0-100 | Transparency |
| rotation | 0-360 | Rotation degrees |
| whiteSpace | wrap | Enable text wrapping |
| html | 0 or 1 | Enable HTML labels |

## Electrical Color Conventions

| Color | Hex | Usage |
|-------|-----|-------|
| Red | #FF0000 | Power/positive/VDC |
| Black | #000000 | Ground/negative |
| Blue | #0066FF | Signal/control |
| Orange | #FF8800 | Output/driven |
| Green | #00AA00 | Input/sensor |
| Yellow | #FFCC00 | Caution/warning |
| Purple | #AA00FF | Analog/special |

## Common Electrical Components

For drawio built-in electrical shapes, use the `shape` style property:
- `mxgraph.electrical.basic_resistor` - Resistor
- `mxgraph.electrical.basic_capacitor` - Capacitor
- `mxgraph.electrical.basic_inductor` - Inductor
- `mxgraph.electrical.basic_diode` - Diode
- `mxgraph.electrical.basic_battery` - Battery
- `mxgraph.electrical.basic_ground` - Ground symbol
- `mxgraph.electrical.basic_fuse` - Fuse
- `mxgraph.electrical.basic_switch` - Switch
- `mxgraph.electrical.basic_transistor_npn` - NPN Transistor
- `mxgraph.electrical.basic_transistor_pnp` - PNP Transistor
- `mxgraph.electrical.basic_motor` - Motor
- `mxgraph.electrical.basic_relay` - Relay coil
- `mxgraph.electrical.basic_transformer` - Transformer

## Workflow: Create a Simple Power Distribution Diagram

1. Create diagram: `POST /api/diagrams`
2. Add battery: `POST /api/diagrams/:name/shapes` with label "BATTERY 48V"
3. Add fuse: `POST /api/diagrams/:name/shapes` with style `shape=mxgraph.electrical.basic_fuse`
4. Add motor controller: `POST /api/diagrams/:name/shapes` with label "MOTOR CTRL"
5. Add motor: `POST /api/diagrams/:name/shapes` with style `shape=mxgraph.electrical.basic_motor`
6. Connect battery -> fuse: `POST /api/diagrams/:name/connections`
7. Connect fuse -> motor controller: `POST /api/diagrams/:name/connections`
8. Connect motor controller -> motor: `POST /api/diagrams/:name/connections`