# Excalidraw CLI — Agent Skill

Create hand-drawn diagrams from JSON using `excalidraw-cli`. Outputs `.excalidraw` files and shareable URLs.

## Quick Start

```bash
# Create diagram from inline JSON
excalidraw create --json '[...elements...]' -o diagram.excalidraw

# Export to shareable URL
excalidraw export diagram.excalidraw
# → https://excalidraw.com/#json=abc,key

# Create from file
excalidraw create elements.json -o diagram.excalidraw

# Pipe from stdin
echo '[...elements...]' | excalidraw create -o diagram.excalidraw
```

## Built-in Defaults (skip these in JSON)

The CLI auto-applies these so you write less JSON:

| Property | Default | Applies To |
|----------|---------|------------|
| `roughness` | `2` (sloppy/hand-drawn) | Shapes, arrows |
| `roundness` | `{ "type": 3 }` (rounded corners) | Shapes |
| `fontFamily` | `1` (Excalifont/Virgil handwritten) | Text |
| `strokeColor` | `"#1e1e1e"` | All |
| `backgroundColor` | `"transparent"` | All |
| `fillStyle` | `"solid"` | All |
| `strokeWidth` | `2` | All |
| `opacity` | `100` | All |

Override any default by setting it explicitly.

## Element Types

### Shapes (rectangle, ellipse, diamond)

Minimal — just type, id, position, size:

```json
{ "type": "rectangle", "id": "r1", "x": 100, "y": 100, "width": 200, "height": 100 }
```

Filled:

```json
{ "type": "rectangle", "id": "r1", "x": 100, "y": 100, "width": 200, "height": 100, "backgroundColor": "#a5d8ff", "fillStyle": "solid" }
```

### Labels (text inside shapes)

Use the `label` shorthand on any shape — the CLI auto-expands it into proper bound text elements:

```json
{ "type": "rectangle", "id": "b1", "x": 100, "y": 100, "width": 200, "height": 80, "backgroundColor": "#a5d8ff", "fillStyle": "solid", "label": { "text": "My Label", "fontSize": 20 } }
```

Works on `rectangle`, `ellipse`, `diamond`, and `arrow`. Optional label properties: `fontSize` (default 20), `fontFamily`, `strokeColor`.

For dark mode, set text color via `strokeColor` in the label:

```json
"label": { "text": "Hello", "strokeColor": "#e5e5e5" }
```

### Standalone Text (titles, annotations)

```json
{ "type": "text", "id": "t1", "x": 100, "y": 50, "text": "Diagram Title", "fontSize": 28 }
```

To center text at position `cx`: set `x = cx - (text.length × fontSize × 0.5) / 2`

### Arrows

Basic arrow:

```json
{ "type": "arrow", "id": "a1", "x": 300, "y": 150, "width": 200, "height": 0, "points": [[0,0],[200,0]], "endArrowhead": "arrow" }
```

- `points`: `[dx, dy]` offsets from the arrow's `x, y`
- `endArrowhead`: `null` | `"arrow"` | `"bar"` | `"dot"` | `"triangle"`

### Arrow Bindings (connect shapes)

```json
{
  "type": "arrow", "id": "a1", "x": 300, "y": 150, "width": 150, "height": 0,
  "points": [[0,0],[150,0]], "endArrowhead": "arrow",
  "startBinding": { "elementId": "b1", "fixedPoint": [1, 0.5] },
  "endBinding": { "elementId": "b2", "fixedPoint": [0, 0.5] }
}
```

**fixedPoint** `[x, y]` — normalized position on the shape edge:
- Right: `[1, 0.5]`
- Left: `[0, 0.5]`
- Top: `[0.5, 0]`
- Bottom: `[0.5, 1]`

When binding arrows, also add the arrow to each shape's `boundElements`:

```json
{ "type": "rectangle", "id": "b1", ..., "boundElements": [{ "id": "b1_t", "type": "text" }, { "id": "a1", "type": "arrow" }] }
```

### Arrow Labels

Use the same `label` shorthand on arrows:

```json
{ "type": "arrow", "id": "a1", "x": 300, "y": 150, "width": 150, "height": 0, "points": [[0,0],[150,0]], "endArrowhead": "arrow", "label": { "text": "connects", "fontSize": 16 } }
```

## Camera (Viewport)

Controls what's visible when opened. MUST be 4:3 aspect ratio:

```json
{ "type": "cameraUpdate", "width": 800, "height": 600, "x": 50, "y": 20 }
```

| Size | Dimensions | Use |
|------|-----------|-----|
| S | 400×300 | 2-3 elements close-up |
| M | 600×450 | Section of diagram |
| **L** | **800×600** | **Standard (default)** |
| XL | 1200×900 | Large overview |
| XXL | 1600×1200 | Panorama |

Set `x, y` to the top-left of your content area (with ~50px padding).

## Color Palette

### Shape Fills (pastel backgrounds)

| Color | Hex | Use |
|-------|-----|-----|
| Light Blue | `#a5d8ff` | Input, sources, primary |
| Light Green | `#b2f2bb` | Success, output |
| Light Orange | `#ffd8a8` | Warning, pending |
| Light Purple | `#d0bfff` | Processing, middleware |
| Light Red | `#ffc9c9` | Error, critical |
| Light Yellow | `#fff3bf` | Notes, decisions |
| Light Teal | `#c3fae8` | Storage, data |
| Light Pink | `#eebefa` | Analytics, metrics |

### Background Zones (use `opacity: 30`)

| Color | Hex | Use |
|-------|-----|-----|
| Blue zone | `#dbe4ff` | Frontend layer |
| Purple zone | `#e5dbff` | Logic/agent layer |
| Green zone | `#d3f9d8` | Data/tool layer |

### Primary Stroke/Text Colors

`#4a9eed` blue, `#f59e0b` amber, `#22c55e` green, `#ef4444` red, `#8b5cf6` purple, `#ec4899` pink, `#06b6d4` cyan, `#84cc16` lime

## Drawing Order

Array order = z-order (first = back, last = front). Emit progressively:

```
camera → background zones → shape1 → shape1_text → arrow1 → arrow1_text → shape2 → ...
```

**BAD**: all rectangles → all texts → all arrows
**GOOD**: shape → its text → its arrows → next shape → its text → ...

## Font Size Rules

- **28+** for diagram titles
- **20** for shape labels and headings
- **16-18** for body text, descriptions
- **14** minimum (secondary annotations only)
- Never below 14

## Element Sizing

- Minimum shape: **120×60** for labeled shapes
- **20-30px** gaps between elements minimum
- Prefer fewer, larger elements over many tiny ones

## Pseudo-Elements

### cameraUpdate (viewport control)

```json
{ "type": "cameraUpdate", "width": 800, "height": 600, "x": 0, "y": 0 }
```

### delete (remove elements by id)

```json
{ "type": "delete", "ids": "b2,a1,t3" }
```

### restoreCheckpoint (build on previous diagram)

```json
{ "type": "restoreCheckpoint", "id": "checkpoint-id-here" }
```

## Checkpoints

```bash
excalidraw checkpoint list
excalidraw checkpoint save mydiagram diagram.excalidraw
excalidraw checkpoint load mydiagram -o restored.excalidraw
excalidraw checkpoint remove mydiagram
```

Use `restoreCheckpoint` in JSON to build on a previous diagram, and `delete` to remove elements from it.

## Dark Mode

Add a massive dark background as the FIRST element:

```json
{ "type": "rectangle", "id": "darkbg", "x": -4000, "y": -3000, "width": 10000, "height": 7500, "backgroundColor": "#1e1e2e", "fillStyle": "solid", "strokeColor": "transparent", "strokeWidth": 0 }
```

Dark fills: `#1e3a5f` blue, `#1a4d2e` green, `#2d1b69` purple, `#5c3d1a` orange, `#5c1a1a` red, `#1a4d4d` teal
Text on dark: `#e5e5e5` primary, `#a0a0a0` muted — set via `strokeColor` on text elements.

## Tips

- No emoji in text — Excalidraw's font doesn't render them
- Minimum text color on white: `#757575`
- Always set `fillStyle: "solid"` when using `backgroundColor`
- Arrow `points` are offsets from the arrow's `x, y`, not absolute coordinates
- Arrow `width`/`height` should match the bounding box of your points

---

## Examples

### Example 1: Simple Flow (3 connected boxes)

Minimal JSON — no roughness, roundness, or fontFamily needed (all defaults). Dark mode with label shorthand.

```bash
excalidraw create --json '[
  { "type": "cameraUpdate", "width": 1200, "height": 900, "x": 0, "y": 100 },
  { "type": "rectangle", "id": "darkbg", "x": -4000, "y": -3000, "width": 10000, "height": 7500, "backgroundColor": "#1e1e2e", "fillStyle": "solid", "strokeColor": "transparent", "strokeWidth": 0 },
  { "type": "rectangle", "id": "b1", "x": 60, "y": 350, "width": 220, "height": 90, "backgroundColor": "#1e3a5f", "fillStyle": "solid", "strokeColor": "#4a9eed", "label": { "text": "Request", "strokeColor": "#e5e5e5" }, "boundElements": [{ "id": "a1", "type": "arrow" }] },
  { "type": "arrow", "id": "a1", "x": 280, "y": 395, "width": 200, "height": 0, "points": [[0,0],[200,0]], "endArrowhead": "arrow", "strokeColor": "#4a9eed", "startBinding": { "elementId": "b1", "fixedPoint": [1, 0.5] }, "endBinding": { "elementId": "b2", "fixedPoint": [0, 0.5] }, "label": { "text": "process", "strokeColor": "#a0a0a0" } },
  { "type": "rectangle", "id": "b2", "x": 500, "y": 350, "width": 220, "height": 90, "backgroundColor": "#5c3d1a", "fillStyle": "solid", "strokeColor": "#f59e0b", "label": { "text": "Server", "strokeColor": "#e5e5e5" }, "boundElements": [{ "id": "a1", "type": "arrow" }, { "id": "a2", "type": "arrow" }] },
  { "type": "arrow", "id": "a2", "x": 720, "y": 395, "width": 200, "height": 0, "points": [[0,0],[200,0]], "endArrowhead": "arrow", "strokeColor": "#22c55e", "startBinding": { "elementId": "b2", "fixedPoint": [1, 0.5] }, "endBinding": { "elementId": "b3", "fixedPoint": [0, 0.5] }, "label": { "text": "respond", "strokeColor": "#a0a0a0" } },
  { "type": "rectangle", "id": "b3", "x": 940, "y": 350, "width": 220, "height": 90, "backgroundColor": "#1a4d2e", "fillStyle": "solid", "strokeColor": "#22c55e", "label": { "text": "Response", "strokeColor": "#e5e5e5" }, "boundElements": [{ "id": "a2", "type": "arrow" }] }
]' -o flow.excalidraw
```

### Example 2: Architecture Diagram (with zones)

```bash
excalidraw create --json '[
  { "type": "cameraUpdate", "width": 1200, "height": 900, "x": 0, "y": 0 },
  { "type": "rectangle", "id": "darkbg", "x": -4000, "y": -3000, "width": 10000, "height": 7500, "backgroundColor": "#1e1e2e", "fillStyle": "solid", "strokeColor": "transparent", "strokeWidth": 0 },
  { "type": "text", "id": "title", "x": 380, "y": 20, "text": "Web App Architecture", "fontSize": 28, "strokeColor": "#e5e5e5" },
  { "type": "rectangle", "id": "zone_fe", "x": 30, "y": 70, "width": 1140, "height": 200, "backgroundColor": "#1e3a5f", "fillStyle": "solid", "opacity": 30, "strokeColor": "transparent" },
  { "type": "text", "id": "zone_fe_t", "x": 50, "y": 80, "text": "Frontend", "fontSize": 16, "strokeColor": "#4a9eed" },
  { "type": "rectangle", "id": "zone_be", "x": 30, "y": 300, "width": 1140, "height": 200, "backgroundColor": "#2d1b69", "fillStyle": "solid", "opacity": 30, "strokeColor": "transparent" },
  { "type": "text", "id": "zone_be_t", "x": 50, "y": 310, "text": "Backend", "fontSize": 16, "strokeColor": "#8b5cf6" },
  { "type": "rectangle", "id": "zone_db", "x": 30, "y": 530, "width": 1140, "height": 200, "backgroundColor": "#1a4d2e", "fillStyle": "solid", "opacity": 30, "strokeColor": "transparent" },
  { "type": "text", "id": "zone_db_t", "x": 50, "y": 540, "text": "Data Layer", "fontSize": 16, "strokeColor": "#22c55e" },
  { "type": "rectangle", "id": "react", "x": 100, "y": 120, "width": 200, "height": 80, "backgroundColor": "#1e3a5f", "fillStyle": "solid", "strokeColor": "#4a9eed", "label": { "text": "React App", "strokeColor": "#e5e5e5" }, "boundElements": [{ "id": "a1", "type": "arrow" }] },
  { "type": "rectangle", "id": "cdn", "x": 500, "y": 120, "width": 200, "height": 80, "backgroundColor": "#1e3a5f", "fillStyle": "solid", "strokeColor": "#4a9eed", "label": { "text": "CDN", "strokeColor": "#e5e5e5" } },
  { "type": "rectangle", "id": "auth", "x": 900, "y": 120, "width": 200, "height": 80, "backgroundColor": "#5c1a1a", "fillStyle": "solid", "strokeColor": "#ef4444", "label": { "text": "Auth (OAuth)", "strokeColor": "#e5e5e5" }, "boundElements": [{ "id": "a3", "type": "arrow" }] },
  { "type": "arrow", "id": "a1", "x": 200, "y": 200, "width": 0, "height": 150, "points": [[0,0],[0,150]], "endArrowhead": "arrow", "strokeColor": "#4a9eed", "startBinding": { "elementId": "react", "fixedPoint": [0.5, 1] }, "endBinding": { "elementId": "api", "fixedPoint": [0.5, 0] }, "label": { "text": "REST API", "strokeColor": "#a0a0a0" } },
  { "type": "rectangle", "id": "api", "x": 100, "y": 360, "width": 200, "height": 80, "backgroundColor": "#2d1b69", "fillStyle": "solid", "strokeColor": "#8b5cf6", "label": { "text": "API Server", "strokeColor": "#e5e5e5" }, "boundElements": [{ "id": "a1", "type": "arrow" }, { "id": "a2", "type": "arrow" }] },
  { "type": "rectangle", "id": "queue", "x": 500, "y": 360, "width": 200, "height": 80, "backgroundColor": "#5c3d1a", "fillStyle": "solid", "strokeColor": "#f59e0b", "label": { "text": "Job Queue", "strokeColor": "#e5e5e5" } },
  { "type": "rectangle", "id": "worker", "x": 900, "y": 360, "width": 200, "height": 80, "backgroundColor": "#5c3d1a", "fillStyle": "solid", "strokeColor": "#f59e0b", "label": { "text": "Workers", "strokeColor": "#e5e5e5" }, "boundElements": [{ "id": "a3", "type": "arrow" }] },
  { "type": "arrow", "id": "a3", "x": 1000, "y": 200, "width": 0, "height": 150, "points": [[0,0],[0,150]], "endArrowhead": "arrow", "strokeColor": "#ef4444", "startBinding": { "elementId": "auth", "fixedPoint": [0.5, 1] }, "endBinding": { "elementId": "worker", "fixedPoint": [0.5, 0] } },
  { "type": "arrow", "id": "a2", "x": 200, "y": 440, "width": 0, "height": 150, "points": [[0,0],[0,150]], "endArrowhead": "arrow", "strokeColor": "#8b5cf6", "startBinding": { "elementId": "api", "fixedPoint": [0.5, 1] }, "endBinding": { "elementId": "pg", "fixedPoint": [0.5, 0] }, "label": { "text": "queries", "strokeColor": "#a0a0a0" } },
  { "type": "rectangle", "id": "pg", "x": 100, "y": 590, "width": 200, "height": 80, "backgroundColor": "#1a4d4d", "fillStyle": "solid", "strokeColor": "#06b6d4", "label": { "text": "PostgreSQL", "strokeColor": "#e5e5e5" }, "boundElements": [{ "id": "a2", "type": "arrow" }] },
  { "type": "rectangle", "id": "redis", "x": 500, "y": 590, "width": 200, "height": 80, "backgroundColor": "#1a4d4d", "fillStyle": "solid", "strokeColor": "#06b6d4", "label": { "text": "Redis Cache", "strokeColor": "#e5e5e5" } },
  { "type": "rectangle", "id": "s3", "x": 900, "y": 590, "width": 200, "height": 80, "backgroundColor": "#1a4d4d", "fillStyle": "solid", "strokeColor": "#06b6d4", "label": { "text": "S3 Storage", "strokeColor": "#e5e5e5" } }
]' -o architecture.excalidraw
```

### Example 3: Decision Flowchart (with diamond)

```bash
excalidraw create --json '[
  { "type": "cameraUpdate", "width": 1200, "height": 900, "x": -20, "y": 0 },
  { "type": "rectangle", "id": "darkbg", "x": -4000, "y": -3000, "width": 10000, "height": 7500, "backgroundColor": "#1e1e2e", "fillStyle": "solid", "strokeColor": "transparent", "strokeWidth": 0 },
  { "type": "rectangle", "id": "start", "x": 430, "y": 60, "width": 200, "height": 80, "backgroundColor": "#1e3a5f", "fillStyle": "solid", "strokeColor": "#4a9eed", "label": { "text": "User Login", "strokeColor": "#e5e5e5" }, "boundElements": [{ "id": "a1", "type": "arrow" }] },
  { "type": "arrow", "id": "a1", "x": 530, "y": 140, "width": 0, "height": 100, "points": [[0,0],[0,100]], "endArrowhead": "arrow", "strokeColor": "#4a9eed", "startBinding": { "elementId": "start", "fixedPoint": [0.5, 1] }, "endBinding": { "elementId": "check", "fixedPoint": [0.5, 0] } },
  { "type": "diamond", "id": "check", "x": 400, "y": 260, "width": 260, "height": 180, "backgroundColor": "#5c3d1a", "fillStyle": "solid", "strokeColor": "#f59e0b", "label": { "text": "Valid\nCredentials?", "strokeColor": "#e5e5e5" }, "boundElements": [{ "id": "a1", "type": "arrow" }, { "id": "a2", "type": "arrow" }, { "id": "a3", "type": "arrow" }] },
  { "type": "arrow", "id": "a2", "x": 660, "y": 350, "width": 180, "height": 0, "points": [[0,0],[180,0]], "endArrowhead": "arrow", "strokeColor": "#22c55e", "startBinding": { "elementId": "check", "fixedPoint": [1, 0.5] }, "endBinding": { "elementId": "yes", "fixedPoint": [0, 0.5] }, "label": { "text": "Yes", "strokeColor": "#22c55e" } },
  { "type": "rectangle", "id": "yes", "x": 860, "y": 310, "width": 220, "height": 80, "backgroundColor": "#1a4d2e", "fillStyle": "solid", "strokeColor": "#22c55e", "label": { "text": "Dashboard", "strokeColor": "#e5e5e5" }, "boundElements": [{ "id": "a2", "type": "arrow" }] },
  { "type": "arrow", "id": "a3", "x": 400, "y": 350, "width": 180, "height": 0, "points": [[0,0],[-180,0]], "endArrowhead": "arrow", "strokeColor": "#ef4444", "startBinding": { "elementId": "check", "fixedPoint": [0, 0.5] }, "endBinding": { "elementId": "no", "fixedPoint": [1, 0.5] }, "label": { "text": "No", "strokeColor": "#ef4444" } },
  { "type": "rectangle", "id": "no", "x": 0, "y": 310, "width": 220, "height": 80, "backgroundColor": "#5c1a1a", "fillStyle": "solid", "strokeColor": "#ef4444", "label": { "text": "Error Page", "strokeColor": "#e5e5e5" }, "boundElements": [{ "id": "a3", "type": "arrow" }] }
]' -o flowchart.excalidraw
```

### Example 4: Kitchen Sink (every feature)

Demonstrates: all shape types, label shorthand, arrow bindings + labels, standalone text, background zones, colors, opacity, dark mode, camera, diamond, ellipse.

```bash
excalidraw create --json '[
  { "type": "cameraUpdate", "width": 1200, "height": 900, "x": -60, "y": -40 },
  { "type": "rectangle", "id": "darkbg", "x": -4000, "y": -3000, "width": 10000, "height": 7500, "backgroundColor": "#1e1e2e", "fillStyle": "solid", "strokeColor": "transparent", "strokeWidth": 0 },
  { "type": "text", "id": "title", "x": 280, "y": -20, "text": "Kitchen Sink: All Features", "fontSize": 28, "strokeColor": "#e5e5e5" },
  { "type": "rectangle", "id": "zone1", "x": -30, "y": 30, "width": 550, "height": 380, "backgroundColor": "#1e3a5f", "fillStyle": "solid", "opacity": 30, "strokeColor": "transparent" },
  { "type": "text", "id": "zone1_t", "x": -10, "y": 40, "text": "Input Layer", "fontSize": 16, "strokeColor": "#4a9eed" },
  { "type": "rectangle", "id": "zone2", "x": 560, "y": 30, "width": 550, "height": 380, "backgroundColor": "#2d1b69", "fillStyle": "solid", "opacity": 30, "strokeColor": "transparent" },
  { "type": "text", "id": "zone2_t", "x": 580, "y": 40, "text": "Processing Layer", "fontSize": 16, "strokeColor": "#8b5cf6" },
  { "type": "rectangle", "id": "b1", "x": 50, "y": 90, "width": 200, "height": 80, "backgroundColor": "#1e3a5f", "fillStyle": "solid", "strokeColor": "#4a9eed", "label": { "text": "API Gateway", "strokeColor": "#e5e5e5" }, "boundElements": [{ "id": "a1", "type": "arrow" }] },
  { "type": "ellipse", "id": "e1", "x": 80, "y": 230, "width": 160, "height": 120, "backgroundColor": "#1a4d4d", "fillStyle": "solid", "strokeColor": "#06b6d4", "label": { "text": "Cache\n(Redis)", "fontSize": 18, "strokeColor": "#e5e5e5" }, "boundElements": [{ "id": "a3", "type": "arrow" }] },
  { "type": "diamond", "id": "d1", "x": 330, "y": 120, "width": 180, "height": 140, "backgroundColor": "#5c3d1a", "fillStyle": "solid", "strokeColor": "#f59e0b", "label": { "text": "Auth\nCheck?", "fontSize": 18, "strokeColor": "#e5e5e5" }, "boundElements": [{ "id": "a1", "type": "arrow" }, { "id": "a2", "type": "arrow" }, { "id": "a4", "type": "arrow" }] },
  { "type": "arrow", "id": "a1", "x": 250, "y": 130, "width": 80, "height": 60, "points": [[0,0],[80,60]], "endArrowhead": "arrow", "strokeColor": "#4a9eed", "startBinding": { "elementId": "b1", "fixedPoint": [1, 0.5] }, "endBinding": { "elementId": "d1", "fixedPoint": [0, 0.5] }, "label": { "text": "request", "fontSize": 14, "strokeColor": "#a0a0a0" } },
  { "type": "arrow", "id": "a2", "x": 510, "y": 190, "width": 130, "height": 0, "points": [[0,0],[130,0]], "endArrowhead": "arrow", "strokeColor": "#22c55e", "startBinding": { "elementId": "d1", "fixedPoint": [1, 0.5] }, "endBinding": { "elementId": "b2", "fixedPoint": [0, 0.5] }, "label": { "text": "valid", "fontSize": 14, "strokeColor": "#22c55e" } },
  { "type": "arrow", "id": "a4", "x": 420, "y": 260, "width": 0, "height": 80, "points": [[0,0],[0,80]], "endArrowhead": "arrow", "strokeColor": "#ef4444", "startBinding": { "elementId": "d1", "fixedPoint": [0.5, 1] }, "endBinding": { "elementId": "err", "fixedPoint": [0.5, 0] }, "label": { "text": "denied", "fontSize": 14, "strokeColor": "#ef4444" } },
  { "type": "rectangle", "id": "err", "x": 340, "y": 340, "width": 160, "height": 60, "backgroundColor": "#5c1a1a", "fillStyle": "solid", "strokeColor": "#ef4444", "label": { "text": "403 Error", "fontSize": 18, "strokeColor": "#e5e5e5" }, "boundElements": [{ "id": "a4", "type": "arrow" }] },
  { "type": "rectangle", "id": "b2", "x": 660, "y": 150, "width": 200, "height": 80, "backgroundColor": "#2d1b69", "fillStyle": "solid", "strokeColor": "#8b5cf6", "label": { "text": "Controller", "strokeColor": "#e5e5e5" }, "boundElements": [{ "id": "a2", "type": "arrow" }, { "id": "a5", "type": "arrow" }] },
  { "type": "arrow", "id": "a5", "x": 760, "y": 230, "width": 0, "height": 100, "points": [[0,0],[0,100]], "endArrowhead": "arrow", "strokeColor": "#8b5cf6", "startBinding": { "elementId": "b2", "fixedPoint": [0.5, 1] }, "endBinding": { "elementId": "b3", "fixedPoint": [0.5, 0] } },
  { "type": "rectangle", "id": "b3", "x": 660, "y": 340, "width": 200, "height": 80, "backgroundColor": "#1a4d2e", "fillStyle": "solid", "strokeColor": "#22c55e", "label": { "text": "Database", "strokeColor": "#e5e5e5" }, "boundElements": [{ "id": "a5", "type": "arrow" }, { "id": "a3", "type": "arrow" }] },
  { "type": "arrow", "id": "a3", "x": 660, "y": 380, "width": 420, "height": 0, "points": [[0,0],[-420,0]], "endArrowhead": "arrow", "strokeColor": "#06b6d4", "startBinding": { "elementId": "b3", "fixedPoint": [0, 0.5] }, "endBinding": { "elementId": "e1", "fixedPoint": [1, 0.5] }, "label": { "text": "cache result", "fontSize": 14, "strokeColor": "#a0a0a0" } },
  { "type": "text", "id": "note", "x": 600, "y": 460, "text": "All shapes, arrows, zones, and dark mode", "fontSize": 16, "strokeColor": "#a0a0a0" }
]' -o kitchen-sink.excalidraw
```

### Minimal Labeled Box Pattern (copy-paste template)

```json
{ "type": "rectangle", "id": "ID", "x": X, "y": Y, "width": 200, "height": 80, "backgroundColor": "COLOR", "fillStyle": "solid", "label": { "text": "LABEL" } }
```

Dark mode version:

```json
{ "type": "rectangle", "id": "ID", "x": X, "y": Y, "width": 200, "height": 80, "backgroundColor": "#1e3a5f", "fillStyle": "solid", "strokeColor": "#4a9eed", "label": { "text": "LABEL", "strokeColor": "#e5e5e5" } }
```

### Minimal Arrow Pattern (copy-paste template)

```json
{ "type": "arrow", "id": "AID", "x": X, "y": Y, "width": W, "height": 0, "points": [[0,0],[W,0]], "endArrowhead": "arrow", "startBinding": { "elementId": "FROM", "fixedPoint": [1, 0.5] }, "endBinding": { "elementId": "TO", "fixedPoint": [0, 0.5] } }
```

With label:

```json
{ "type": "arrow", "id": "AID", "x": X, "y": Y, "width": W, "height": 0, "points": [[0,0],[W,0]], "endArrowhead": "arrow", "startBinding": { "elementId": "FROM", "fixedPoint": [1, 0.5] }, "endBinding": { "elementId": "TO", "fixedPoint": [0, 0.5] }, "label": { "text": "LABEL", "fontSize": 16 } }
```

### Dark Mode Background (copy-paste template)

```json
{ "type": "rectangle", "id": "darkbg", "x": -4000, "y": -3000, "width": 10000, "height": 7500, "backgroundColor": "#1e1e2e", "fillStyle": "solid", "strokeColor": "transparent", "strokeWidth": 0 }
```
