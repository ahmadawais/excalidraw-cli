/**
 * Excalidraw CLI — Programmatic API
 *
 * Import this module to use Excalidraw CLI functionality in your own code.
 */

// Core element processing
export {
  parseElements,
  checkCameraAspectRatio,
  resolveElements,
  filterDrawElements,
  generateCheckpointId,
  buildExcalidrawFile,
  createDiagram,
} from "./lib/elements.js";
export type { CreateDiagramResult } from "./lib/elements.js";

// Checkpoint stores
export {
  FileCheckpointStore,
  MemoryCheckpointStore,
} from "./lib/checkpoint.js";
export type { CheckpointStore, CheckpointData } from "./lib/checkpoint.js";

// Export to excalidraw.com
export { exportToUrl } from "./lib/export.js";

// Reference / cheat sheet
export { REFERENCE } from "./lib/reference.js";
