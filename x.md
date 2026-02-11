Introducing a new CLI: excalidraw-cli

$ npx excalidraw-cli create --json '[...]'

Hand-drawn diagrams from the command line — because opening a browser to draw boxes and arrows is beneath us.

EXCALIDRAW CLI
🎨  Style: Hand-drawn (sloppy)
✏️  Font: Excalifont/Virgil
📐  Shapes: rectangle, ellipse, diamond, arrow, text
🌙  Mode: Dark

excalidraw-cli create --json '[...]'          → Create a diagram
excalidraw-cli create elements.json -o d.excalidraw → From file
excalidraw-cli export diagram.excalidraw      → Upload to excalidraw.com
excalidraw-cli checkpoint save name file      → Save diagram state
excalidraw-cli reference                      → Element format cheat sheet
cat elements.json | excalidraw-cli create     → Pipe support

Zero-config:
* Auto hand-drawn styling — roughness, rounded corners, handwritten font
* Works with npx — no install needed
* Outputs standard .excalidraw files

Shape Types:
* rectangle, ellipse, diamond — with label shorthand
* arrow — startBinding/endBinding with fixedPoint
* text — standalone or bound inside shapes

Camera Presets (4:3):
* 400×300 (S) → 800×600 (L) → 1600×1200 (XXL)

Dark Mode:
* Full dark theme color palettes
* Background zones with opacity control
* Just add a dark background rectangle and light stroke colors

Works with AI Agents:
npx skills add ahmadawais/excalidraw-cli
Then ask your agent to create diagrams, flowcharts, or architecture docs.

Examples:

# 3 connected boxes
excalidraw-cli create --json '[{"type":"rectangle","id":"b1",...}]' -o flow.excalidraw

# Decision flowchart with diamond
excalidraw-cli create --json '[{"type":"diamond","id":"d1",...}]' -o flowchart.excalidraw

# Kitchen sink — every feature, dark mode
excalidraw-cli create --json '[...]' -o kitchen-sink.excalidraw

what diagrams are you drawing from the terminal?
