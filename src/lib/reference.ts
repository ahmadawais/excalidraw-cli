/** Excalidraw Element Format Reference */

export const REFERENCE = `# Excalidraw Element Format

## Color Palette (use consistently across all tools)

### Primary Colors
| Name | Hex | Use |
|------|-----|-----|
| Blue | \`#4a9eed\` | Primary actions, links, data series 1 |
| Amber | \`#f59e0b\` | Warnings, highlights, data series 2 |
| Green | \`#22c55e\` | Success, positive, data series 3 |
| Red | \`#ef4444\` | Errors, negative, data series 4 |
| Purple | \`#8b5cf6\` | Accents, special items, data series 5 |
| Pink | \`#ec4899\` | Decorative, data series 6 |
| Cyan | \`#06b6d4\` | Info, secondary, data series 7 |
| Lime | \`#84cc16\` | Extra, data series 8 |

### Excalidraw Fills (pastel, for shape backgrounds)
| Color | Hex | Good For |
|-------|-----|----------|
| Light Blue | \`#a5d8ff\` | Input, sources, primary nodes |
| Light Green | \`#b2f2bb\` | Success, output, completed |
| Light Orange | \`#ffd8a8\` | Warning, pending, external |
| Light Purple | \`#d0bfff\` | Processing, middleware, special |
| Light Red | \`#ffc9c9\` | Error, critical, alerts |
| Light Yellow | \`#fff3bf\` | Notes, decisions, planning |
| Light Teal | \`#c3fae8\` | Storage, data, memory |
| Light Pink | \`#eebefa\` | Analytics, metrics |

### Background Zones (use with opacity: 30 for layered diagrams)
| Color | Hex | Good For |
|-------|-----|----------|
| Blue zone | \`#dbe4ff\` | UI / frontend layer |
| Purple zone | \`#e5dbff\` | Logic / agent layer |
| Green zone | \`#d3f9d8\` | Data / tool layer |

---

## Excalidraw Elements

### Required Fields (all elements)
\`type\`, \`id\` (unique string), \`x\`, \`y\`, \`width\`, \`height\`

### Defaults (skip these)
strokeColor="#1e1e1e", backgroundColor="transparent", fillStyle="solid", strokeWidth=2, roughness=2 (sloppy/hand-drawn), opacity=100
Shapes get roundness={type:3} (rounded corners) by default. Text gets fontFamily=1 (Excalifont/Virgil handwritten) by default.
Canvas background is white.

### Element Types

**Rectangle**: \`{ "type": "rectangle", "id": "r1", "x": 100, "y": 100, "width": 200, "height": 100 }\`
- \`roundness: { type: 3 }\` for rounded corners
- \`backgroundColor: "#a5d8ff"\`, \`fillStyle: "solid"\` for filled

**Ellipse**: \`{ "type": "ellipse", "id": "e1", "x": 100, "y": 100, "width": 150, "height": 150 }\`

**Diamond**: \`{ "type": "diamond", "id": "d1", "x": 100, "y": 100, "width": 150, "height": 150 }\`

**Labeled shape (PREFERRED)**: Add \`label\` to any shape for auto-centered text. The CLI expands this into proper bound text elements.
\`{ "type": "rectangle", "id": "r1", "x": 100, "y": 100, "width": 200, "height": 80, "label": { "text": "Hello", "fontSize": 20 } }\`
- Works on rectangle, ellipse, diamond, arrow
- Label properties: \`text\` (required), \`fontSize\` (default 20), \`fontFamily\`, \`strokeColor\`
- Saves tokens vs separate text elements
- For dark mode text: \`"label": { "text": "Hello", "strokeColor": "#e5e5e5" }\`

**Labeled arrow**: \`"label": { "text": "connects" }\` on an arrow element.

**Standalone text** (titles, annotations only):
\`{ "type": "text", "id": "t1", "x": 150, "y": 138, "text": "Hello", "fontSize": 20 }\`
- x is the LEFT edge of the text. To center text at position cx: set x = cx - estimatedWidth/2
- estimatedWidth ≈ text.length × fontSize × 0.5
- Do NOT rely on textAlign or width for positioning — they only affect multi-line wrapping

**Arrow**: \`{ "type": "arrow", "id": "a1", "x": 300, "y": 150, "width": 200, "height": 0, "points": [[0,0],[200,0]], "endArrowhead": "arrow" }\`
- points: [dx, dy] offsets from element x,y
- endArrowhead: null | "arrow" | "bar" | "dot" | "triangle"

### Arrow Bindings
Arrow: \`"startBinding": { "elementId": "r1", "fixedPoint": [1, 0.5] }\`
fixedPoint: top=[0.5,0], bottom=[0.5,1], left=[0,0.5], right=[1,0.5]

**cameraUpdate** (pseudo-element — controls the viewport, not drawn):
\`{ "type": "cameraUpdate", "width": 800, "height": 600, "x": 0, "y": 0 }\`
- x, y: top-left corner of the visible area (scene coordinates)
- width, height: size of the visible area — MUST be 4:3 ratio (400×300, 600×450, 800×600, 1200×900, 1600×1200)
- No \`id\` needed — this is not a drawn element

**delete** (pseudo-element — removes elements by id):
\`{ "type": "delete", "ids": "b2,a1,t3" }\`
- Comma-separated list of element ids to remove
- Also removes bound text elements (matching containerId)
- Place AFTER the elements you want to remove
- Never reuse a deleted id — always assign new ids to replacements

### Drawing Order
- Array order = z-order (first = back, last = front)
- Emit progressively: background → shape → its label → its arrows → next shape
- BAD: all rectangles → all texts → all arrows
- GOOD: bg_shape → shape1 → text1 → arrow1 → shape2 → text2 → ...

### Example: Two connected labeled boxes
\`\`\`json
[
  { "type": "cameraUpdate", "width": 800, "height": 600, "x": 50, "y": 50 },
  { "type": "rectangle", "id": "b1", "x": 100, "y": 100, "width": 200, "height": 100, "roundness": { "type": 3 }, "backgroundColor": "#a5d8ff", "fillStyle": "solid", "label": { "text": "Start", "fontSize": 20 } },
  { "type": "rectangle", "id": "b2", "x": 450, "y": 100, "width": 200, "height": 100, "roundness": { "type": 3 }, "backgroundColor": "#b2f2bb", "fillStyle": "solid", "label": { "text": "End", "fontSize": 20 } },
  { "type": "arrow", "id": "a1", "x": 300, "y": 150, "width": 150, "height": 0, "points": [[0,0],[150,0]], "endArrowhead": "arrow", "startBinding": { "elementId": "b1", "fixedPoint": [1, 0.5] }, "endBinding": { "elementId": "b2", "fixedPoint": [0, 0.5] } }
]
\`\`\`

### Camera & Sizing

**Recommended camera sizes (4:3 aspect ratio ONLY):**
- Camera **S**: width 400, height 300 — close-up on a small group (2-3 elements)
- Camera **M**: width 600, height 450 — medium view, a section of a diagram
- Camera **L**: width 800, height 600 — standard full diagram (DEFAULT)
- Camera **XL**: width 1200, height 900 — large diagram overview
- Camera **XXL**: width 1600, height 1200 — panorama / final overview

ALWAYS use one of these exact sizes. Non-4:3 viewports cause distortion.

**Font size rules:**
- Minimum fontSize: **16** for body text, labels, descriptions
- Minimum fontSize: **20** for titles and headings
- Minimum fontSize: **14** for secondary annotations only (sparingly)
- NEVER use fontSize below 14

**Element sizing rules:**
- Minimum shape size: 120×60 for labeled rectangles/ellipses
- Leave 20-30px gaps between elements minimum
- Prefer fewer, larger elements over many tiny ones

## Dark Mode

For dark theme diagrams, use a massive dark background rectangle as the FIRST element:
\`{"type":"rectangle","id":"darkbg","x":-4000,"y":-3000,"width":10000,"height":7500,"backgroundColor":"#1e1e2e","fillStyle":"solid","strokeColor":"transparent","strokeWidth":0}\`

**Text colors (on dark):**
| Color | Hex | Use |
|-------|-----|-----|
| White | \`#e5e5e5\` | Primary text, titles |
| Muted | \`#a0a0a0\` | Secondary text, annotations |

**Shape fills (on dark):**
| Color | Hex | Good For |
|-------|-----|----------|
| Dark Blue | \`#1e3a5f\` | Primary nodes |
| Dark Green | \`#1a4d2e\` | Success, output |
| Dark Purple | \`#2d1b69\` | Processing, special |
| Dark Orange | \`#5c3d1a\` | Warning, pending |
| Dark Red | \`#5c1a1a\` | Error, critical |
| Dark Teal | \`#1a4d4d\` | Storage, data |

## Tips
- Use the color palette consistently
- Text contrast is CRITICAL — never use light gray on white backgrounds
- Minimum text color on white: #757575
- Do NOT use emoji in text — they don't render in Excalidraw's font
`;
