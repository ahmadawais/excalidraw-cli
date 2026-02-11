# Excalidraw CLI

Create hand-drawn Excalidraw diagrams from the command line. Generate `.excalidraw` files, manage diagram checkpoints, export to excalidraw.com, and reference the complete element format — all without leaving your terminal.

## Install

```bash
npm i -g excalidraw-cli
```

Or run directly:

```bash
npx excalidraw create --json '[...]'
```

## Usage

```bash
excalidraw [command] [options]
```

### Commands

#### `create` — Create a diagram

```bash
# From a JSON file
excalidraw create elements.json -o diagram.excalidraw

# From inline JSON
excalidraw create --json '[{"type":"rectangle","id":"r1","x":100,"y":100,"width":200,"height":100}]'

# From stdin
cat elements.json | excalidraw create -o output.excalidraw

# From an existing .excalidraw file (re-process)
excalidraw create existing.excalidraw -o new.excalidraw

# Skip checkpoint saving
excalidraw create elements.json --no-checkpoint
```

#### `export` — Upload to excalidraw.com

```bash
excalidraw export diagram.excalidraw
# → https://excalidraw.com/#json=abc123,key
```

#### `reference` (alias: `ref`) — Element format cheat sheet

```bash
excalidraw reference       # Colorized output
excalidraw ref --raw       # Raw markdown
```

#### `checkpoint` (alias: `cp`) — Manage diagram state

```bash
excalidraw checkpoint list                      # List all checkpoints
excalidraw checkpoint save mydiagram file.excalidraw  # Save as named checkpoint
excalidraw checkpoint load mydiagram -o out.excalidraw  # Restore from checkpoint
excalidraw checkpoint remove mydiagram          # Delete a checkpoint
```

### Options

```
-v, --version    Output version number
-h, --help       Display help
--no-banner      Suppress ASCII art banner
```

## Programmatic API

```typescript
import {
  createDiagram,
  parseElements,
  buildExcalidrawFile,
  filterDrawElements,
  resolveElements,
  generateCheckpointId,
  checkCameraAspectRatio,
} from "excalidraw";

import { FileCheckpointStore, MemoryCheckpointStore } from "excalidraw";
import { exportToUrl } from "excalidraw";
import { REFERENCE } from "excalidraw";
```

### Create a diagram

```typescript
const store = new MemoryCheckpointStore();
const result = await createDiagram(
  JSON.stringify([
    { type: "rectangle", id: "r1", x: 100, y: 100, width: 200, height: 100 },
  ]),
  store,
);

// result.file — complete .excalidraw file object
// result.checkpointId — unique ID for this diagram state
// result.warnings — any validation warnings
```

### Export to excalidraw.com

```typescript
const url = await exportToUrl(JSON.stringify(excalidrawFileData));
console.log(url); // https://excalidraw.com/#json=...
```

### Checkpoint management

```typescript
const store = new FileCheckpointStore(); // ~/.excalidraw/checkpoints/
await store.save("my-diagram", { elements: [...] });
const data = await store.load("my-diagram");
const ids = await store.list();
await store.remove("my-diagram");
```

## Element Format

Run `excalidraw reference` for the complete element format reference, including:

- **Color palettes** — primary colors, pastel fills, background zones, dark mode
- **Element types** — rectangle, ellipse, diamond, text, arrow with all properties
- **Labeled shapes** — auto-centered text with `label` property
- **Arrow bindings** — connect shapes with `startBinding`/`endBinding`
- **Camera sizing** — 4:3 aspect ratio presets (S/M/L/XL/XXL)
- **Drawing order** — progressive element ordering for streaming
- **Dark mode** — colors and setup for dark theme diagrams

## Development

```bash
pnpm install
pnpm run build    # Build with tsup
pnpm run dev      # Watch mode
pnpm run test     # Run tests with vitest
pnpm run lint     # Type check with tsc
```

## License

MIT
