---
name: electrical-wiring-standards
description: Use when creating or editing electrical/power distribution wiring diagrams that need to follow proper engineering conventions, color codes, and component standards.
---

# Electrical Wiring Standards

## Overview

Electrical wiring diagrams must follow consistent conventions for color coding, component labeling, and layout so they are readable, maintainable, and safe to build from. This is especially important for vehicle power distribution systems (tractors, EVs, industrial equipment).

## Wire Color Conventions

Use these colors consistently across all diagrams:

| Color | Hex | Usage | Example |
|-------|-----|-------|---------|
| Red | `#FF0000` | **HV Power (positive)** — Battery+, main bus, DC-DC input | 48V traction, high-current |
| Black | `#000000` | **Ground / Negative return** — GND, chassis ground, battery- | All ground connections |
| Blue | `#0066FF` | **LV Power / Control signal** — 12V/24V supply, enable signals | DC-DC output, relay coil drive |
| Orange | `#FF8800` | **Output / Driven load** — Motor drives, actuator outputs, contactor coils | Contactor enable, precharge |
| Green | `#00AA00` | **Input / Sensor** — Digital inputs, status signals, feedback | BMS_OK, ignition sense |
| Yellow | `#FFCC00` | **Caution / Warning / Auxiliary** — Battery packs, caution circuits | Battery indicator, precharge |
| Purple | `#AA00FF` | **Analog / Special** — Analog signals, CAN bus, special functions | Throttle, temperature, CAN_H/L |

## Component Labeling Standards

### Main Labels
- **Battery**: `Battery [Voltage] [Capacity]` — e.g., "Battery 48V 200Ah"
- **Fuse**: `Fuse [Current]A` — e.g., "Fuse 200A" or "Main Fuse 200A"
- **Contactor/Relay**: `Contactor [Function]` or `Relay [Function]` — e.g., "Contactor Main" or "Relay Precharge"
- **Motor Controller**: `Motor Controller [Model]` — e.g., "Motor Controller XYZ-5000"
- **Motor**: `[Type] Motor [Power]` — e.g., "Traction Motor 10kW"
- **DC-DC**: `DC-DC Converter [Input]V→[Output]V` — e.g., "DC-DC Converter 48V→12V"
- **BMS**: `BMS` — simple label, add battery info in description
- **VCU/ECU**: `[Type] — [Function]` — e.g., "VCU — Vehicle Controller"

### Pin Labels (for connectors/ICs)
- Use uppercase short form: `VCC`, `GND`, `IGN`, `THR`, `CAN_H`, `CAN_L`
- Group by function: power pins on top, ground on bottom, signals on sides
- Label every pin — no unlabeled pins

## Component Placement Standards

### Vertical Layout (Power Distribution)
```
                    ┌─────────────┐
                    │   Battery    │  ← Top of diagram
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  Main Fuse  │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  Contactor  │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
       ┌──────▼──────┐    │    ┌───────▼───────┐
       │ Motor Ctrl  │    │    │ DC-DC 48→12V  │
       └──────┬──────┘    │    └───────┬───────┘
              │            │            │
       ┌──────▼──────┐    │    ┌───────▼───────┐
       │    Motor    │    │    │  12V Battery   │
       └─────────────┘    │    └───────────────┘
                          │
                   ┌──────▼──────┐
                   │    BMS      │  ← Bottom/Side
                   └─────────────┘
```

### Horizontal Layout (Signal Flow)
```
[Input Sensor] → [VCU/ECU] → [Output Driver] → [Load]
```

## Component Spacing Rules

- **Between power components**: minimum 80px horizontal, 60px vertical
- **Between signal components**: minimum 40px in all directions
- **Wire/connection paths**: leave 40px clearance around connection lines
- **Diagram margins**: minimum 30px from edge of diagram
- **Group spacing**: 100px minimum between logical groups

## Required Components by Circuit Type

### High-Voltage Traction Circuit (48V+)
- [ ] Battery pack with voltage + capacity label
- [ ] Main fuse (rated for battery max current)
- [ ] Main contactor/contactor (with precharge circuit)
- [ ] Motor controller / inverter
- [ ] Traction motor
- [ ] BMS with communication to contactor
- [ ] Precharge resistor (parallel to contactor)
- [ ] Ground symbol on HV negative

### Low-Voltage Control Circuit (12V/24V)
- [ ] DC-DC converter (step-down from HV)
- [ ] LV battery (for backup/standby)
- [ ] LV fuse block / distribution panel
- [ ] VCU/ECU (if applicable)
- [ ] Ignition switch / key switch
- [ ] Ground symbol on LV negative

### Common Mistakes
- Missing fuse on battery positive line
- No precharge circuit on high-voltage contactors
- Ground symbols omitted or unclear
- Pin labels on ICs/connectors missing
- Inconsistent wire colors between HV and LV sections
- Components placed without regard to signal flow direction
- Overlapping connection lines without route planning