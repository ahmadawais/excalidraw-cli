# Changelog

## 0.0.2 (2026-02-11)

### 📖 Documentation

- README lingo fixes.


## 0.0.1 (2026-02-11)

### 📦 Features

- **`create` command** — Create `.excalidraw` diagrams from inline JSON, JSON files, stdin, or existing `.excalidraw` files
- **`export` command** — Upload diagrams to excalidraw.com and get shareable URLs
- **`reference` command** — Element format cheat sheet with color palettes, element types, bindings, camera sizing, and dark mode
- **`checkpoint` command** — Save, load, list, and remove named diagram states (`~/.excalidraw/checkpoints/`)
- **Auto hand-drawn styling** — Sloppy roughness, rounded corners, and Excalifont/Virgil font applied by default
- **Label shorthand** — `label` property auto-expands into proper bound text elements on shapes and arrows
- **Arrow bindings** — `startBinding`/`endBinding` with `fixedPoint` for precise edge connections
- **Camera/viewport control** — `cameraUpdate` element with 4:3 ratio presets (S/M/L/XL/XXL)
- **All shape types** — `rectangle`, `ellipse`, `diamond`, `text`, `arrow` with full property support
- **Dark mode support** — Full dark theme color palettes and background setup
- **Background zones** — Semi-transparent colored regions for grouping elements
- **Programmatic API** — `createDiagram`, `parseElements`, `buildExcalidrawFile`, `exportToUrl`, checkpoint stores, and more
- **AI Agent skill** — Install via `npx skills add ahmadawais/excalidraw-cli`
- **ASCII art banner** — Suppressible with `--no-banner`

### 📖 Documentation

- README with full CLI usage, examples, and programmatic API docs
- Demo images for all examples (Simple Flow, Decision Flowchart, Kitchen Sink)
- Agent skill guide at `skills/skill.md`
