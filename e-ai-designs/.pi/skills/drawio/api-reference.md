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

### Built-in drawio Electrical Shapes (via `shape` style property)

These are always available and should be used for basic passive, switching, and power components:

**Passive Components:**
- `mxgraph.electrical.resistors.resistor` — Resistor (IEC)
- `mxgraph.electrical.capacitors.capacitor` — Capacitor
- `mxgraph.electrical.inductors.inductor` — Inductor
- `mxgraph.electrical.inductors.transformer` — Transformer
- `mxgraph.electrical.miscellaneous.crystal` — Crystal oscillator

**Semiconductors:**
- `mxgraph.electrical.diodes.diode` — Standard diode
- `mxgraph.electrical.diodes.zener_diode` — Zener diode
- `mxgraph.electrical.diodes.bridge_rectifier` — Bridge rectifier
- `mxgraph.electrical.transistors.npn_transistor_1` — NPN transistor
- `mxgraph.electrical.transistors.pnp_transistor_1` — PNP transistor
- `mxgraph.electrical.transistors.thyristor` — Thyristor/SCR
- `mxgraph.electrical.transistors.triac` — TRIAC
- `mxgraph.electrical.abstract.op_amp` — Operational amplifier

**Switching & Protection:**
- `mxgraph.electrical.switches_and_relays.switch_1` — SPST switch
- `mxgraph.electrical.switches_and_relays.relay` — Relay
- `mxgraph.electrical.miscellaneous.fuse` — Fuse

**Power & Sources:**
- `mxgraph.electrical.signal_sources.dc_source_1` — DC voltage source
- `mxgraph.electrical.signal_sources.ac_source` — AC source
- `mxgraph.electrical.signal_sources.ground` — Ground
- `mxgraph.electrical.miscellaneous.dc_dc_converter` — DC-DC converter
- `mxgraph.electrical.miscellaneous.voltage_regulator` — Voltage regulator

**Output:**
- `mxgraph.electrical.miscellaneous.motor` — Motor
- `mxgraph.electrical.miscellaneous.speaker` — Speaker
- `mxgraph.electrical.miscellaneous.buzzer` — Buzzer
- `mxgraph.electrical.miscellaneous.lamp` — Lamp
- `mxgraph.electrical.optoelectronics.led` — LED

**Logic:**
- `mxgraph.electrical.logic_gates.and` — AND gate
- `mxgraph.electrical.logic_gates.or` — OR gate
- `mxgraph.electrical.logic_gates.not` — NOT gate
- `mxgraph.electrical.logic_gates.nand` — NAND gate
- `mxgraph.electrical.logic_gates.nor` — NOR gate
- `mxgraph.electrical.logic_gates.xor` — XOR gate
- `mxgraph.electrical.logic_gates.buffer` — Buffer
- `mxgraph.electrical.logic_gates.d_type_flip-flop` — D flip-flop
- `mxgraph.electrical.logic_gates.multiplexer` — Multiplexer

### EAI-IC Stencil Library (for IC/Microcontroller components)

Loaded automatically from `http://localhost:3000/stencils/eai-ic.xml`. These are pre-built composite components with labeled pins. Use them via the stencil panel in the editor — not via the REST API.

**Available ICs:**
- Arduino Uno, Arduino Nano — with individual pin labels
- Raspberry Pi, Raspberry Pi A+/B+, Raspberry Pi B+
- ESP32, QT Py, NodeMCU
- Integrated Circuit (1, 2, 3, 4×25) — Generic ICs
- Microcontroller — Generic MCU
- BCD Decoder, VS1053

To add an IC to a diagram, drag it from the stencil panel in the editor, or place it via the shapes API with `shape=stencil;component=NAME` if the stencil is loaded.

### Creating Custom ICs

Use the **drawio-ic-builder** skill for creating new IC components (motor controllers, custom MCUs, etc.) with proper pinout, sizing, and styling.

## Workflow: Create a Simple Power Distribution Diagram

1. Create diagram: `POST /api/diagrams`
2. Add battery: `POST /api/diagrams/:name/shapes` with label "BATTERY 48V"
3. Add fuse: `POST /api/diagrams/:name/shapes` with style `shape=mxgraph.electrical.basic_fuse`
4. Add motor controller: `POST /api/diagrams/:name/shapes` with label "MOTOR CTRL"
5. Add motor: `POST /api/diagrams/:name/shapes` with style `shape=mxgraph.electrical.basic_motor`
6. Connect battery -> fuse: `POST /api/diagrams/:name/connections`
7. Connect fuse -> motor controller: `POST /api/diagrams/:name/connections`
8. Connect motor controller -> motor: `POST /api/diagrams/:name/connections`