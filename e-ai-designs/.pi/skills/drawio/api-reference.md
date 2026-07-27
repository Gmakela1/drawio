# drawio API Reference

## API Conventions

- Base URL: `http://localhost:3000/api`
- Request body: `application/json`
- Response: `{ success: true, data: ... }` or `{ success: false, error: "..." }`
- Shape IDs are returned as strings on creation (e.g., `"shape:resistor_r1"`)

---

## 1. Diagram Management

```bash
# List all diagrams
GET /api/diagrams

# Create a new blank diagram (single-page mxGraphModel)
POST /api/diagrams
Body: { "name": "my-project.drawio" }

# Get a diagram's XML content
GET /api/diagrams/:name

# Overwrite a diagram (use for multi-page or full XML replacement)
PUT /api/diagrams/:name
Body: { "xml": "<?xml version=\"1.0\"?>\n<mxGraphModel>..." }

# Delete a diagram
DELETE /api/diagrams/:name

# List all shapes in a diagram
GET /api/diagrams/:name/list
```

### Multi-Page Diagrams

The drawio editor natively supports multi-page diagrams using `<mxfile>` format. Each page is a `<diagram>` element inside an `<mxfile>` wrapper:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<mxfile>
  <diagram name="Page-1">
    <mxGraphModel>...page 1 content...</mxGraphModel>
  </diagram>
  <diagram name="Page-2">
    <mxGraphModel>...page 2 content...</mxGraphModel>
  </diagram>
</mxfile>
```

**To create a multi-page diagram:**
- Use `PUT /api/diagrams/:name` with the full `<mxfile>` XML in the body
- Do NOT use the shapes API for multi-page files — it only works on single-page `mxGraphModel` files
- The editor's Save button automatically saves all pages via `getFileData(true)`
- The editor's Load button uses `openFile()` which handles both single and multi-page

**Important:** The shapes API (`POST /api/diagrams/:name/shapes`, etc.) only works on single-page `mxGraphModel` files. For multi-page files, modify the full XML content and use `PUT /api/diagrams/:name` to overwrite.

---

## 2. Shapes

The shapes API works on single-page `mxGraphModel` files only. For multi-page files, use `PUT /api/diagrams/:name` with the full XML.

### Creating a Shape

```bash
POST /api/diagrams/:name/shapes
```

**Body format — style must be a JSON object, NOT a string:**

```json
{
  "x": 100,
  "y": 200,
  "width": 120,
  "height": 60,
  "label": "Battery 48V",
  "style": {
    "fillColor": "#FFCC00",
    "strokeColor": "#000000",
    "strokeWidth": 2,
    "rounded": 1,
    "fontSize": 12,
    "fontColor": "#000000"
  }
}
```

⚠️ **Style must be a JSON object** (e.g., `{"fillColor":"#FF0000"}`). Passing a string like `"fillColor=#FF0000"` will cause double-escaping.

### Updating Shapes

```bash
# Update position, size, label, or style
PUT /api/diagrams/:name/shapes/:id
Body: { "x": 150, "y": 200, "width": 140, "height": 70, "label": "New Label", "style": { "fillColor": "#00FF00" } }

# Move
POST /api/diagrams/:name/shapes/:id/move
Body: { "x": 50, "y": 50 }

# Resize
POST /api/diagrams/:name/shapes/:id/resize
Body: { "width": 120, "height": 60 }

# Set label
POST /api/diagrams/:name/shapes/:id/label
Body: { "label": "New Label" }

# Fill color
POST /api/diagrams/:name/shapes/:id/fill
Body: { "color": "#FF0000" }

# Stroke color/width
POST /api/diagrams/:name/shapes/:id/stroke
Body: { "color": "#000000", "width": 2 }

# Delete a shape
DELETE /api/diagrams/:name/shapes/:id
```

### ⚠️ locked=1 Limitation

The `locked=1` style attribute on shapes prevents manual edits in the drawio editor GUI, but it does **not** protect against API-driven modifications. The shapes API will apply changes to any shape regardless of its `locked` status. This is by design — the API is trusted.

---

## 3. Connections

### Creating a Connection

```bash
POST /api/diagrams/:name/connections
```

**Body — uses `from` and `to` field names (not `source`/`target`):**

```json
{
  "from": "shape_12345",
  "to": "shape_67890",
  "label": "48V",
  "style": {
    "strokeColor": "#FF0000",
    "strokeWidth": 2
  }
}
```

**Required fields:**
- `from` — Source shape ID (string)
- `to` — Target shape ID (string)

**Optional fields:**
- `label` — Connection label text (string)
- `style` — Style properties as a JSON object (see Style Reference)

### ⚠️ API Connections Must Explicitly Remove Arrows

The default edge style in the editor is `endArrow=none;startArrow=none`, but this default does **not** apply to API-created connections. All API connections must explicitly include arrow removal in the style:

```json
{
  "style": {
    "strokeColor": "#FF0000",
    "strokeWidth": 2,
    "endArrow": "none",
    "startArrow": "none"
  }
}
```

### Updating Connections

```bash
# Update label and style
PUT /api/diagrams/:name/connections/:id
Body: { "label": "Updated Label", "style": { "strokeColor": "#0066FF", "strokeWidth": 1 } }

# Delete a connection
DELETE /api/diagrams/:name/connections/:id
```

---

## 4. Groups

```bash
# Create a group
POST /api/diagrams/:name/groups
Body: { "children": ["shape_1", "shape_2"], "label": "Power Section" }

# Add child to group
POST /api/diagrams/:name/groups/:id/add
Body: { "childId": "shape_3" }

# Remove child from group
POST /api/diagrams/:name/groups/:id/remove
Body: { "childId": "shape_3" }

# Ungroup (keeps children)
DELETE /api/diagrams/:name/groups/:id
```

---

## 5. Pinout / IC Components

```bash
# Create a microcontroller with pinout
POST /api/diagrams/:name/pinout
Body: {
  "x": 100, "y": 200, "width": 200, "height": 300,
  "label": "VCU",
  "pins": [
    { "side": "left", "index": 1, "label": "VDD", "type": "power" },
    { "side": "left", "index": 2, "label": "PA0", "type": "gpio" },
    { "side": "right", "index": 1, "label": "CON_EN", "type": "output" },
    { "side": "top", "index": 1, "label": "VCC", "type": "power" },
    { "side": "bottom", "index": 1, "label": "GND", "type": "ground" }
  ]
}
```

Pin types and their colors: `power` (#FF0000), `ground` (#000000), `gpio` (#00AA00), `input` (#0066FF), `output` (#FF8800), `analog` (#AA00FF).

---

## 6. Stencil Libraries

```bash
# List stencil libraries
GET /api/stencils

# Create a new library
POST /api/stencils
Body: { "name": "my-library" }

# Get library content
GET /api/stencils/:name.xml

# Update library
PUT /api/stencils/:name.xml
Body: { "xml": "<mxlibrary>...</mxlibrary>" }

# Delete library
DELETE /api/stencils/:name.xml
```

---

## 7. Export

```bash
# Export diagram (query: ?format=png or ?format=svg)
GET /api/export/:name?format=png
```

---

## mxGraph Style Reference

All style properties are passed as a **JSON object** (not a string). The server converts them to the drawio style string format internally.

| Property | Example | Description |
|----------|---------|-------------|
| fillColor | "#FF0000" | Fill color hex or "none" |
| strokeColor | "#000000" | Border color hex |
| strokeWidth | 2 | Border width in px |
| gradientColor | "#FFFFFF" | Gradient end color |
| rounded | 0 or 1 | Round corners |
| fontSize | 12 | Text size |
| fontColor | "#000000" | Text color |
| fontStyle | 0, 1, 2, 3 | 0=normal, 1=bold, 2=italic, 3=bold+italic |
| align | "left", "center", "right" | Horizontal text align |
| verticalAlign | "top", "middle", "bottom" | Vertical text align |
| dashed | 0 or 1 | Dashed border |
| dashPattern | "3 3" | Dash pattern |
| shape | "rectangle", "ellipse", "rhombus", etc. | Shape type |
| opacity | 0-100 | Transparency |
| rotation | 0-360 | Rotation degrees |
| whiteSpace | "wrap" | Enable text wrapping |
| html | 0 or 1 | Enable HTML labels |
| endArrow | "none" or "classic" | Arrow on end of connection |
| startArrow | "none" or "classic" | Arrow on start of connection |
| locked | 0 or 1 | Prevent editor GUI edits (not API-proof) |

---

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

---

## Limitations

- **File size**: The write tool has a practical limit of ~10KB for single writes. For large diagrams, use the shapes API to add components incrementally, or write a Node.js script to generate the XML.
- **locked=1**: The `locked` style attribute prevents editor GUI edits but does NOT protect against API modifications. All API endpoints will modify shapes regardless of their locked status.
- **Multi-page**: The shapes API only works on single-page files. For multi-page, use `PUT /api/diagrams/:name` with the full `<mxfile>` XML.
- **Connection defaults**: The editor's default connection style (no arrows) does NOT apply to API-created connections. Always explicitly set `endArrow=none;startArrow=none` in API connection styles.