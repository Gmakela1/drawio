/**
 * Schematic Component Builder (v3)
 * 
 * Builds components from drawio primitives (rectangles, text, lines, pins)
 * that render correctly in stencil libraries.
 * 
 * Focus: microcontrollers, ICs, motor controllers, motors, power components
 */

const fs = require('fs');
const path = require('path');

const DEFAULT_W = 120;
const DEFAULT_H = 80;

function escapeXml(str) {
    return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ─── Component Builders ───────────────────────────────────────────────

/**
 * Resistor: zigzag line or rectangle
 */
function buildResistor(label, variant) {
    const w = 120, h = 30;
    let body;
    if (variant === 'US') {
        // Zigzag using polyline style
        body = `<mxCell id="3" parent="1" vertex="1" value="${escapeXml(label)}" style="shape=mxgraph.basic.zigzag;strokeColor=#000000;strokeWidth=2;fillColor=none;align=center;verticalAlign=middle;fontSize=10;">
      <mxGeometry x="0" y="0" width="${w}" height="${h}" as="geometry"/>
    </mxCell>`;
    } else {
        body = `<mxCell id="3" parent="1" vertex="1" value="${escapeXml(label)}" style="fillColor=#FFFFFF;strokeColor=#000000;strokeWidth=2;align=center;verticalAlign=middle;fontSize=10;">
      <mxGeometry x="10" y="10" width="100" height="10" as="geometry"/>
    </mxCell>`;
    }
    // Connection leads
    const leads = 
        `<mxCell id="4" parent="1" vertex="1" style="fillColor=#000000;strokeColor=none;">
      <mxGeometry x="0" y="${h/2}" width="10" height="1" as="geometry"/>
    </mxCell>
    <mxCell id="5" parent="1" vertex="1" style="fillColor=#000000;strokeColor=none;">
      <mxGeometry x="110" y="${h/2}" width="10" height="1" as="geometry"/>
    </mxCell>`;
    
    return { xml: `<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/>\n${leads}\n${body}\n</root></mxGraphModel>`, w, h };
}

/**
 * Capacitor: two parallel vertical lines
 */
function buildCapacitor(label) {
    const w = 40, h = 60;
    const xml = `<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/>
    <mxCell id="2" parent="1" vertex="1" style="fillColor=#000000;strokeColor=none;">
      <mxGeometry x="10" y="0" width="2" height="${h}" as="geometry"/>
    </mxCell>
    <mxCell id="3" parent="1" vertex="1" style="fillColor=#000000;strokeColor=none;">
      <mxGeometry x="28" y="0" width="2" height="${h}" as="geometry"/>
    </mxCell>
    <mxCell id="4" parent="1" vertex="1" value="${escapeXml(label)}" style="text;align=center;fontSize=10;">
      <mxGeometry x="0" y="${h-15}" width="${w}" height="14" as="geometry"/>
    </mxCell>
  </root></mxGraphModel>`;
    return { xml, w, h };
}

/**
 * Diode: triangle + line
 */
function buildDiode(label) {
    const w = 80, h = 40;
    const xml = `<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/>
    <mxCell id="2" parent="1" vertex="1" value="${escapeXml(label)}" style="shape=mxgraph.basic.triangle;strokeColor=#000000;strokeWidth=2;fillColor=none;rotation=-90;align=center;verticalAlign=middle;fontSize=9;">
      <mxGeometry x="20" y="5" width="20" height="30" as="geometry"/>
    </mxCell>
    <mxCell id="3" parent="1" vertex="1" style="fillColor=#000000;strokeColor=none;">
      <mxGeometry x="40" y="0" width="1" height="${h}" as="geometry"/>
    </mxCell>
    <mxCell id="4" parent="1" vertex="1" style="fillColor=#000000;strokeColor=none;">
      <mxGeometry x="0" y="${h/2}" width="20" height="1" as="geometry"/>
    </mxCell>
    <mxCell id="5" parent="1" vertex="1" style="fillColor=#000000;strokeColor=none;">
      <mxGeometry x="41" y="${h/2}" width="39" height="1" as="geometry"/>
    </mxCell>
  </root></mxGraphModel>`;
    return { xml, w, h };
}

/**
 * Fuse: rectangle with line through it
 */
function buildFuse(label) {
    const w = 100, h = 30;
    const xml = `<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/>
    <mxCell id="2" parent="1" vertex="1" value="${escapeXml(label)}" style="fillColor=none;strokeColor=#000000;strokeWidth=2;align=center;verticalAlign=middle;fontSize=10;">
      <mxGeometry x="10" y="5" width="80" height="20" as="geometry"/>
    </mxCell>
    <mxCell id="3" parent="1" vertex="1" style="fillColor=#000000;strokeColor=none;">
      <mxGeometry x="0" y="${h/2}" width="10" height="1" as="geometry"/>
    </mxCell>
    <mxCell id="4" parent="1" vertex="1" style="fillColor=#000000;strokeColor=none;">
      <mxGeometry x="90" y="${h/2}" width="10" height="1" as="geometry"/>
    </mxCell>
  </root></mxGraphModel>`;
    return { xml, w, h };
}

/**
 * Ground: three descending lines
 */
function buildGround() {
    const w = 40, h = 40;
    const xml = `<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/>
    <mxCell id="2" parent="1" vertex="1" style="fillColor=#000000;strokeColor=none;">
      <mxGeometry x="${w/2}" y="0" width="1" height="15" as="geometry"/>
    </mxCell>
    <mxCell id="3" parent="1" vertex="1" style="fillColor=#000000;strokeColor=none;">
      <mxGeometry x="${w/2-10}" y="15" width="21" height="1" as="geometry"/>
    </mxCell>
    <mxCell id="4" parent="1" vertex="1" style="fillColor=#000000;strokeColor=none;">
      <mxGeometry x="${w/2-7}" y="22" width="15" height="1" as="geometry"/>
    </mxCell>
    <mxCell id="5" parent="1" vertex="1" style="fillColor=#000000;strokeColor=none;">
      <mxGeometry x="${w/2-4}" y="29" width="9" height="1" as="geometry"/>
    </mxCell>
  </root></mxGraphModel>`;
    return { xml, w, h };
}

/**
 * Motor: circle with M
 */
function buildMotor(label) {
    const w = 70, h = 70;
    const xml = `<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/>
    <mxCell id="2" parent="1" vertex="1" value="M" style="ellipse;fillColor=#FFFFFF;strokeColor=#000000;strokeWidth=2;fontSize=20;fontStyle=1;align=center;verticalAlign=middle;">
      <mxGeometry x="10" y="10" width="50" height="50" as="geometry"/>
    </mxCell>
    <mxCell id="3" parent="1" vertex="1" value="${escapeXml(label)}" style="text;align=center;fontSize=9;">
      <mxGeometry x="0" y="60" width="${w}" height="12" as="geometry"/>
    </mxCell>
  </root></mxGraphModel>`;
    return { xml, w, h };
}

/**
 * Inductor/coil: scalloped shape
 */
function buildInductor(label) {
    const w = 80, h = 30;
    const xml = `<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/>
    <mxCell id="2" parent="1" vertex="1" value="${escapeXml(label)}" style="shape=mxgraph.basic.scalloped_rectangle;strokeColor=#000000;strokeWidth=2;fillColor=none;align=center;verticalAlign=middle;fontSize=10;">
      <mxGeometry x="10" y="5" width="60" height="20" as="geometry"/>
    </mxCell>
    <mxCell id="3" parent="1" vertex="1" style="fillColor=#000000;strokeColor=none;">
      <mxGeometry x="0" y="${h/2}" width="10" height="1" as="geometry"/>
    </mxCell>
    <mxCell id="4" parent="1" vertex="1" style="fillColor=#000000;strokeColor=none;">
      <mxGeometry x="70" y="${h/2}" width="10" height="1" as="geometry"/>
    </mxCell>
  </root></mxGraphModel>`;
    return { xml, w, h };
}

/**
 * Transistor: circle with connections
 */
function buildTransistor(label) {
    const w = 60, h = 70;
    const xml = `<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/>
    <mxCell id="2" parent="1" vertex="1" value="${escapeXml(label)}" style="ellipse;fillColor=#FFFFFF;strokeColor=#000000;strokeWidth=2;fontSize=9;align=center;verticalAlign=middle;">
      <mxGeometry x="15" y="15" width="30" height="30" as="geometry"/>
    </mxCell>
    <mxCell id="3" parent="1" vertex="1" style="fillColor=#000000;strokeColor=none;">
      <mxGeometry x="0" y="${h/2}" width="15" height="1" as="geometry"/>
    </mxCell>
    <mxCell id="4" parent="1" vertex="1" style="fillColor=#000000;strokeColor=none;">
      <mxGeometry x="45" y="${h/2}" width="15" height="1" as="geometry"/>
    </mxCell>
    <mxCell id="5" parent="1" vertex="1" style="fillColor=#000000;strokeColor=none;">
      <mxGeometry x="${w/2}" y="0" width="1" height="15" as="geometry"/>
    </mxCell>
    <mxCell id="6" parent="1" vertex="1" value="B" style="text;align=center;fontSize=7;">
      <mxGeometry x="${w/2-5}" y="0" width="10" height="10" as="geometry"/>
    </mxCell>
    <mxCell id="7" parent="1" vertex="1" value="C" style="text;align=left;fontSize=7;">
      <mxGeometry x="48" y="${h/2-10}" width="12" height="10" as="geometry"/>
    </mxCell>
    <mxCell id="8" parent="1" vertex="1" value="E" style="text;align=right;fontSize=7;">
      <mxGeometry x="0" y="${h/2-10}" width="12" height="10" as="geometry"/>
    </mxCell>
  </root></mxGraphModel>`;
    return { xml, w, h };
}

/**
 * Microcontroller / IC: rectangle with labeled pins on sides
 */
function buildMicrocontroller(name, pins) {
    const pinCount = pins ? pins.length : 8;
    const pinsPerSide = Math.ceil(pinCount / 4);
    const pinSpacing = 26;
    const bodyMargin = 45;
    const w = 280;
    const h = 100 + pinsPerSide * pinSpacing;
    
    let cells = '';
    let id = 3;
    
    // IC body — light fill, dark outline
    cells += `<mxCell id="2" parent="1" vertex="1" value="${escapeXml(name)}" style="rounded=1;fillColor=#FFFFFF;fontColor=#000000;strokeColor=#000000;strokeWidth=2;align=center;verticalAlign=middle;fontSize=12;fontStyle=1;whiteSpace=wrap;overflow=hidden;">
      <mxGeometry x="${bodyMargin}" y="${bodyMargin}" width="${w-2*bodyMargin}" height="${h-2*bodyMargin}" as="geometry"/>
    </mxCell>\n`;
    
    // Pin connections
    if (pins) {
        const left = pins.filter(p => p.side === 'left');
        const right = pins.filter(p => p.side === 'right');
        const top = pins.filter(p => p.side === 'top');
        const bottom = pins.filter(p => p.side === 'bottom');
        const bodyX = bodyMargin;
        const bodyY = bodyMargin;
        const bodyW = w - 2*bodyMargin;
        const bodyH = h - 2*bodyMargin;
        
        // Left pins — label inside body, line outside
        for (let i = 0; i < left.length; i++) {
            const y = bodyY + (bodyH / (left.length + 1)) * (i + 1);
            // External lead line
            cells += `<mxCell id="${id++}" parent="1" vertex="1" style="fillColor=#000000;strokeColor=none;">
      <mxGeometry x="${bodyX - 15}" y="${y}" width="15" height="1" as="geometry"/>
    </mxCell>\n`;
            // Label inside body (left-aligned, vertically centered on pin)
            cells += `<mxCell id="${id++}" parent="1" vertex="1" value="${escapeXml(left[i].label)}" style="text;align=left;fontSize=7;fillColor=none;strokeColor=none;">
      <mxGeometry x="${bodyX + 3}" y="${y-10}" width="40" height="12" as="geometry"/>
    </mxCell>\n`;
        }
        // Right pins
        for (let i = 0; i < right.length; i++) {
            const y = bodyY + (bodyH / (right.length + 1)) * (i + 1);
            cells += `<mxCell id="${id++}" parent="1" vertex="1" style="fillColor=#000000;strokeColor=none;">
      <mxGeometry x="${bodyX + bodyW}" y="${y}" width="15" height="1" as="geometry"/>
    </mxCell>\n`;
            cells += `<mxCell id="${id++}" parent="1" vertex="1" value="${escapeXml(right[i].label)}" style="text;align=right;fontSize=7;fillColor=none;strokeColor=none;">
      <mxGeometry x="${bodyX + bodyW - 43}" y="${y-10}" width="40" height="12" as="geometry"/>
    </mxCell>\n`;
        }
        // Top pins
        for (let i = 0; i < top.length; i++) {
            const x = bodyX + (bodyW / (top.length + 1)) * (i + 1);
            cells += `<mxCell id="${id++}" parent="1" vertex="1" style="fillColor=#000000;strokeColor=none;">
      <mxGeometry x="${x}" y="${bodyY - 15}" width="1" height="15" as="geometry"/>
    </mxCell>\n`;
            cells += `<mxCell id="${id++}" parent="1" vertex="1" value="${escapeXml(top[i].label)}" style="text;align=center;fontSize=7;fillColor=none;strokeColor=none;">
      <mxGeometry x="${x-20}" y="${bodyY - 2}" width="40" height="12" as="geometry"/>
    </mxCell>\n`;
        }
        // Bottom pins
        for (let i = 0; i < bottom.length; i++) {
            const x = bodyX + (bodyW / (bottom.length + 1)) * (i + 1);
            cells += `<mxCell id="${id++}" parent="1" vertex="1" style="fillColor=#000000;strokeColor=none;">
      <mxGeometry x="${x}" y="${bodyY + bodyH}" width="1" height="15" as="geometry"/>
    </mxCell>\n`;
            cells += `<mxCell id="${id++}" parent="1" vertex="1" value="${escapeXml(bottom[i].label)}" style="text;align=center;fontSize=7;fillColor=none;strokeColor=none;">
      <mxGeometry x="${x-20}" y="${bodyY + bodyH - 21}" width="40" height="12" as="geometry"/>
    </mxCell>\n`;
        }
    }
    
    const xml = `<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/>\n${cells}</root></mxGraphModel>`;
    return { xml, w, h };
}

// ─── Component Registry ───────────────────────────────────────────────

const BUILDERS = {
    'resistor': (name) => buildResistor('R', 'IEC'),
    'us_resistor': (name) => buildResistor('R', 'US'),
    'capacitor': (name) => buildCapacitor('C'),
    'inductor': (name) => buildInductor('L'),
    'diode': (name) => buildDiode('D'),
    'alternative_diode': (name) => buildDiode('D'),
    'standard_diode': (name) => buildDiode('D'),
    'fuse': (name) => buildFuse('F'),
    'alternative_ground': (name) => buildGround(),
    'motor': (name) => buildMotor('M'),
    'speaker': (name) => buildMotor('SPK'),
    'buzzer': (name) => buildMotor('BZ'),
    'servo_motor': (name) => buildMotor('SERVO'),
    'bipolar_stepper_motor': (name) => buildMotor('STEP'),
    'stepper_motor': (name) => buildMotor('STEP'),
    'transistor': (name) => buildTransistor('Q'),
    'reed_switch': (name) => buildFuse('REED'),
};

// ─── Category Map ─────────────────────────────────────────────────────

const CATEGORY_MAP = {
    'resistor': 'passive', 'us_resistor': 'passive', 'capacitor': 'passive',
    'inductor': 'passive', 'transformer': 'passive', 'crystal': 'passive',
    'wire': 'passive', 'bus': 'passive', 'connector': 'passive', 'antenna': 'passive',
    'external_connection': 'passive', 'label': 'passive',

    'diode': 'semiconductor', 'alternative_diode': 'semiconductor',
    'standard_diode': 'semiconductor', 'transistor': 'semiconductor',
    'thyristor': 'semiconductor', 'triac': 'semiconductor',
    'op_amp': 'semiconductor', 'phototransistor': 'semiconductor',

    'fuse': 'switching', 'switch': 'switching', 'relay': 'switching',
    'relay_2': 'switching', 'multi_pole_switch': 'switching',
    'solid_state_relay': 'switching', 'reed_switch': 'switching',

    'source': 'power', 'ac_dc_converter': 'power', 'generator': 'power',
    'bridge_rectifier': 'power', 'voltage_regulator': 'power',
    'meter': 'power', 'alternative_ground': 'power', 'flow': 'power',
    'frequency_filter': 'power',

    'motor': 'output', 'bipolar_stepper_motor': 'output',
    'stepper_motor': 'output', 'servo_motor': 'output',
    'speaker': 'output', 'buzzer': 'output', 'lamp': 'output',
    'heater': 'output', 'pump': 'output', 'rgb_led': 'output',
    '7_segment_display': 'output', 'hd44780': 'output', 'lcd_driver': 'output',

    'logic_gate': 'logic', 'logic_gate_3_input': 'logic',
    'd_flip_flop': 'logic', 'jk_flip_flop': 'logic', 't_flip_flop': 'logic',
    'multiplexer': 'logic', 'demultiplexer': 'logic', 'counter_4_bit': 'logic',
    'adder': 'logic', 'digital_buffer': 'logic',

    'hall_effect_sensor': 'sensors', 'microphone': 'sensors',
    'photovoltaic_cell': 'sensors', 'ir_sensor': 'sensors',
    'ultrasonic_distance_sensor': 'sensors', 'real_time_clock': 'sensors',
    'signal_generator': 'sensors', 'oscilloscope': 'sensors',
    'josephson_junction': 'sensors', '555_oscillator': 'sensors',

    // ICs & dev boards
    'arduino_uno': 'ic', 'arduino_mega_2560': 'ic', 'arduino_nano': 'ic',
    'arduino_nano_v2': 'ic', 'arduino_nano_v3': 'ic', 'arduino_leonardo': 'ic',
    'esp32': 'ic', 'node_mcu': 'ic', 'raspberry_pi': 'ic',
    'raspberry_pi_pico': 'ic', 'raspberry_pi_b': 'ic',
    'raspberry_pi_a_b_2_3_zero': 'ic', 'atmega328': 'ic', 'qt_py': 'ic',
    'bcd_decoder': 'ic', 'bcd_counter': 'ic', 'decade_counter': 'ic',
    'microcontroller': 'ic', 'integrated_circuit': 'ic',
    'integrated_circuit_2': 'ic', 'integrated_circuit_3': 'ic',
    'integrated_circuit_4x25': 'ic', 'vs1053': 'ic',
    'dfrobot_dfplayer_mini': 'ic',
    
    // Top-level category dirs
    'ic': 'ic', 'output': 'output', 'misc': 'misc', 'common': 'passive',
};

// ─── File Processing ──────────────────────────────────────────────────

function parseComponentXml(xmlString) {
    const nameMatch = xmlString.match(/<meta name="name" value="([^"]*)"/);
    const name = nameMatch ? nameMatch[1] : 'Unknown';

    const configurations = [];
    const configRegex = /<configuration\s+([^>]+?)\/?>/g;
    let configMatch;
    while ((configMatch = configRegex.exec(xmlString)) !== null) {
        const attrs = {};
        const attrRegex = /(\w+)="([^"]*)"/g;
        let am;
        while ((am = attrRegex.exec(configMatch[1])) !== null) attrs[am[1]] = am[2];
        if (attrs.name) configurations.push({
            name: attrs.name, value: attrs.value || '',
            implements: attrs.implements || null
        });
    }

    // Extract connection info for ICs
    const connections = [];
    const connRegex = /<connection\s+([^>]+?)\/?>/g;
    let connMatch;
    while ((connMatch = connRegex.exec(xmlString)) !== null) {
        const attrs = {};
        const attrRegex = /(\w+)="([^"]*)"/g;
        let am;
        while ((am = attrRegex.exec(connMatch[1])) !== null) attrs[am[1]] = am[2];
        if (attrs.start && attrs.end) {
            connections.push({ name: attrs.name || '', start: attrs.start, end: attrs.end, edge: attrs.edge || 'start' });
        }
    }

    return { name, configurations, connections };
}

function categorize(dirName) {
    const key = dirName.toLowerCase().replace(/-/g, '_');
    return CATEGORY_MAP[key] || 'misc';
}

function findXmlFiles(dir) {
    const results = [];
    function walk(d) {
        if (!fs.existsSync(d)) return;
        const items = fs.readdirSync(d, { withFileTypes: true });
        for (const item of items) {
            const fp = path.join(d, item.name);
            if (item.isDirectory()) {
                if (!item.name.startsWith('.') && item.name !== '.github') walk(fp);
            } else if (item.name.endsWith('.xml') && !item.name.startsWith('.')) {
                results.push(fp);
            }
        }
    }
    walk(dir);
    return results;
}

function buildStencilEntry(xml, componentName, w, h) {
    // Strip XML declaration and wrap properly
    const cleanXml = xml.replace(/<\?xml[^?]*\?>/g, '').trim();
    const fullXml = `<?xml version="1.0" encoding="UTF-8"?>\n${cleanXml}`;
    return { xml: fullXml, w: w || DEFAULT_W, h: h || DEFAULT_H, title: componentName };
}

function buildStencilLibrary(entries, name) {
    const jsonEntries = entries.map(e => ({ xml: e.xml, w: e.w, h: e.h, title: e.title }));
    const json = JSON.stringify(jsonEntries);
    const xmlSafe = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    return `<mxlibrary>${xmlSafe}</mxlibrary>`;
}

// ─── IC Pin Maps (from circuitdiagram metadata) ───────────────────────

// Expands grouped pin labels like 'D0-D7' into individual pins
function expandPins(pins) {
    const expanded = [];
    for (const pin of pins) {
        const letterMatch = pin.label.match(/^([A-Z])(\d+)-\1(\d+)$/);
        if (letterMatch) {
            const prefix = letterMatch[1];
            const start = parseInt(letterMatch[2]);
            const end = parseInt(letterMatch[3]);
            if (!isNaN(start) && !isNaN(end) && end > start && end - start < 20) {
                for (let i = start; i <= end; i++) {
                    expanded.push({ side: pin.side, label: prefix + i });
                }
                continue;
            }
        }
        expanded.push(pin);
    }
    return expanded;
}

const IC_PINS = {
    'arduino_uno': [
        { side: 'left', label: 'D0-D7' }, { side: 'left', label: 'AREF' },
        { side: 'left', label: 'GND' }, { side: 'left', label: 'D13' },
        { side: 'right', label: 'A0-A5' }, { side: 'right', label: '3.3V' },
        { side: 'right', label: '5V' }, { side: 'right', label: 'GND' },
        { side: 'top', label: 'VIN' },
        { side: 'bottom', label: 'RESET' },
    ],
    'arduino_nano': [
        { side: 'left', label: 'D2-D7' }, { side: 'left', label: 'D8' },
        { side: 'left', label: 'D9-D12' }, { side: 'left', label: '3.3V' },
        { side: 'right', label: 'A0-A5' }, { side: 'right', label: 'A6-A7' },
        { side: 'right', label: '5V' }, { side: 'right', label: 'GND' },
        { side: 'top', label: 'VIN' },
        { side: 'bottom', label: 'RST' },
    ],
    'esp32': [
        { side: 'left', label: 'EN' }, { side: 'left', label: 'GPIO36' },
        { side: 'left', label: 'GPIO39' }, { side: 'left', label: 'GPIO34' },
        { side: 'left', label: 'GPIO35' }, { side: 'left', label: 'GPIO32' },
        { side: 'right', label: 'GPIO23' }, { side: 'right', label: 'GPIO22' },
        { side: 'right', label: 'GPIO21' }, { side: 'right', label: 'GPIO19' },
        { side: 'right', label: 'GPIO18' }, { side: 'right', label: 'GPIO5' },
        { side: 'top', label: '3.3V' },
        { side: 'bottom', label: 'GND' },
    ],
    'raspberry_pi_pico': [
        { side: 'left', label: 'GPIO0' }, { side: 'left', label: 'GPIO1' },
        { side: 'left', label: 'GND' }, { side: 'left', label: 'GPIO2' },
        { side: 'left', label: 'GPIO3' }, { side: 'left', label: 'GPIO4' },
        { side: 'right', label: 'GPIO28' }, { side: 'right', label: 'GPIO27' },
        { side: 'right', label: 'GPIO26' }, { side: 'right', label: 'RUN' },
        { side: 'right', label: 'GPIO22' }, { side: 'right', label: 'GND' },
        { side: 'top', label: 'VBUS' },
        { side: 'bottom', label: '3.3V' },
    ],
};

// ─── Batch Converter ──────────────────────────────────────────────────

function convertAll(sourceDir, outputDir) {
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const libraries = {};
    const files = findXmlFiles(sourceDir);

    for (const file of files) {
        const dirName = path.basename(path.dirname(file));
        const parentDir = path.basename(path.dirname(path.dirname(file)));
        const fileName = path.basename(file, '.xml');
        
        // Skip files that aren't in proper component directories
        if (dirName === '.' || fileName === dirName && parentDir === 'circuitdiagram-components') continue;
        
        // Determine the component key (for looking up builders and pin maps)
        // For files in subdirs: use dirName (e.g., resistor/resistor.xml → resistor)
        // For files directly in category dirs: use fileName (e.g., ic/vs1053.xml → vs1053)
        const componentKey = (dirName === 'ic' || dirName === 'output' || dirName === 'misc' || dirName === 'common')
            ? fileName.toLowerCase().replace(/-/g, '_')
            : dirName.toLowerCase().replace(/-/g, '_');
        
        // Determine category: use parent folder for top-level files, dirName otherwise
        const categorySource = (dirName === 'ic' || dirName === 'output' || dirName === 'misc' || dirName === 'common')
            ? dirName
            : dirName;
        const category = categorize(categorySource);

        try {
            const xml = fs.readFileSync(file, 'utf8');
            const parsed = parseComponentXml(xml);

            if (!libraries[category]) libraries[category] = [];

            // Check if it's a known IC with pinout
            if (IC_PINS[componentKey]) {
                const expandedPins = expandPins(IC_PINS[componentKey]);
                const result = buildMicrocontroller(parsed.name, expandedPins);
                libraries[category].push(buildStencilEntry(result.xml, parsed.name, result.w, result.h));
            }
            // Check if it's a known component with a builder
            else if (BUILDERS[componentKey]) {
                const result = BUILDERS[componentKey](parsed.name);
                libraries[category].push(buildStencilEntry(result.xml, parsed.name, result.w, result.h));
                
                // Add configuration variants
                for (const cfg of parsed.configurations) {
                    if (cfg.name === parsed.name) continue;
                    const cfgResult = BUILDERS[componentKey](cfg.name);
                    libraries[category].push(buildStencilEntry(cfgResult.xml, cfg.name, cfgResult.w, cfgResult.h));
                }
            }
            // For general ICs with connections, build a microcontroller-style symbol
            else if (parsed.connections.length >= 4) {
                const pins = parsed.connections.slice(0, 16).map((c, i) => {
                    const side = i % 4 === 0 ? 'left' : i % 4 === 1 ? 'right' : i % 4 === 2 ? 'top' : 'bottom';
                    return { side, label: c.name || `PIN${i+1}` };
                });
                const result = buildMicrocontroller(parsed.name, pins);
                libraries[category].push(buildStencilEntry(result.xml, parsed.name, result.w, result.h));
            }
            // Fallback: simple labeled box
            else {
                const w = 120, h = 60;
                const cellXml = `<mxCell id="2" parent="1" vertex="1" value="${escapeXml(parsed.name)}" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#EEEEEE;strokeColor=#000000;align=center;verticalAlign=middle;fontSize=10;">
      <mxGeometry x="0" y="0" width="${w}" height="${h}" as="geometry"/>
    </mxCell>`;
                const modelXml = `<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/>\n${cellXml}\n</root></mxGraphModel>`;
                libraries[category].push(buildStencilEntry(modelXml, parsed.name, w, h));
            }
        } catch (e) {
            console.error(`Error: ${file} — ${e.message}`);
        }
    }

    const libNames = {
        passive: 'eai-passive', semiconductor: 'eai-semiconductor',
        switching: 'eai-switching', power: 'eai-power',
        ic: 'eai-ic', output: 'eai-output',
        logic: 'eai-logic', sensors: 'eai-sensors',
        misc: 'eai-misc'
    };

    const written = [];
    for (const [category, entries] of Object.entries(libraries)) {
        const libName = libNames[category] || 'eai-other';
        const libXml = buildStencilLibrary(entries, libName);
        const outPath = path.join(outputDir, `${libName}.xml`);
        fs.writeFileSync(outPath, libXml, 'utf8');
        written.push({ file: `${libName}.xml`, components: entries.length });
    }
    return written;
}

module.exports = { convertAll };
