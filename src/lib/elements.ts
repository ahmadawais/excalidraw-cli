import crypto from "node:crypto";
import type { CheckpointData, CheckpointStore } from "./checkpoint.js";

/** Pseudo-element types that are not standard Excalidraw elements. */
const PSEUDO_TYPES = new Set(["cameraUpdate", "delete", "restoreCheckpoint"]);

/**
 * Validate and parse an Excalidraw elements JSON string.
 * @throws Error if the JSON is invalid.
 */
export function parseElements(json: string): any[] {
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) {
      throw new Error("Elements must be a JSON array");
    }
    return parsed;
  } catch (e) {
    throw new Error(
      `Invalid JSON: ${(e as Error).message}. Ensure no comments, no trailing commas, and proper quoting.`,
    );
  }
}

/**
 * Check camera aspect ratios in elements array.
 * Returns a warning string if non-4:3 cameras are found, empty string otherwise.
 */
export function checkCameraAspectRatio(elements: any[]): string {
  const cameras = elements.filter((el: any) => el.type === "cameraUpdate");
  const badRatio = cameras.find((c: any) => {
    if (!c.width || !c.height) return false;
    const ratio = c.width / c.height;
    return Math.abs(ratio - 4 / 3) > 0.15;
  });
  if (badRatio) {
    return `Warning: cameraUpdate used ${badRatio.width}x${badRatio.height} — use 4:3 aspect ratio (e.g. 400x300, 800x600).`;
  }
  return "";
}

/**
 * Resolve restoreCheckpoint and delete pseudo-elements against a checkpoint store.
 * Returns the fully resolved element array ready for output.
 */
export async function resolveElements(
  elements: any[],
  store: CheckpointStore,
): Promise<{ elements: any[]; warnings: string[] }> {
  const warnings: string[] = [];

  const ratioWarning = checkCameraAspectRatio(elements);
  if (ratioWarning) warnings.push(ratioWarning);

  const restoreEl = elements.find((el: any) => el.type === "restoreCheckpoint");
  let resolvedElements: any[];

  if (restoreEl?.id) {
    const base = await store.load(restoreEl.id);
    if (!base) {
      throw new Error(
        `Checkpoint "${restoreEl.id}" not found — it may have expired or never existed.`,
      );
    }

    const deleteIds = new Set<string>();
    for (const el of elements) {
      if (el.type === "delete") {
        for (const id of String(el.ids ?? el.id).split(","))
          deleteIds.add(id.trim());
      }
    }

    const baseFiltered = base.elements.filter(
      (el: any) => !deleteIds.has(el.id) && !deleteIds.has(el.containerId),
    );
    const newEls = elements.filter(
      (el: any) =>
        el.type !== "restoreCheckpoint" && el.type !== "delete",
    );
    resolvedElements = [...baseFiltered, ...newEls];
  } else {
    resolvedElements = elements.filter((el: any) => el.type !== "delete");
  }

  return { elements: resolvedElements, warnings };
}

/**
 * Filter out pseudo-elements, returning only standard Excalidraw elements.
 */
export function filterDrawElements(elements: any[]): any[] {
  return elements.filter((el: any) => !PSEUDO_TYPES.has(el.type));
}

/**
 * Generate a short, unique checkpoint ID.
 */
export function generateCheckpointId(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 18);
}

const SHAPE_TYPES = new Set(["rectangle", "ellipse", "diamond"]);
const LABELABLE_TYPES = new Set(["rectangle", "ellipse", "diamond", "arrow"]);

export function expandLabels(elements: any[]): any[] {
  const result: any[] = [];
  for (const el of elements) {
    if (LABELABLE_TYPES.has(el.type) && el.label) {
      const { label, ...shape } = el;
      const textId = `${shape.id}_label`;
      const boundRef = { id: textId, type: "text" as const };
      shape.boundElements = [...(shape.boundElements || []), boundRef];

      const textEl: any = {
        type: "text",
        id: textId,
        x: shape.x + 10,
        y: shape.y + 10,
        width: (shape.width || 100) - 20,
        height: (shape.height || 60) - 20,
        text: label.text,
        fontSize: label.fontSize || 20,
        fontFamily: label.fontFamily || 1,
        textAlign: "center",
        verticalAlign: "middle",
        containerId: shape.id,
      };
      if (label.strokeColor) textEl.strokeColor = label.strokeColor;
      if (el.strokeColor && !label.strokeColor && el.type !== "arrow") {
        textEl.strokeColor = el.strokeColor;
      }

      result.push(shape, textEl);
    } else {
      result.push(el);
    }
  }
  return result;
}

function applyDefaults(elements: any[]): any[] {
  return elements.map((el: any) => {
    const out = { ...el };
    if (SHAPE_TYPES.has(el.type)) {
      if (out.roundness === undefined) out.roundness = { type: 3 };
      if (out.roughness === undefined) out.roughness = 2;
    }
    if (el.type === "arrow") {
      if (out.roughness === undefined) out.roughness = 2;
    }
    if (el.type === "text") {
      if (out.fontFamily === undefined) out.fontFamily = 1;
    }
    return out;
  });
}

/**
 * Build a complete Excalidraw file JSON structure from elements.
 */
export function buildExcalidrawFile(elements: any[]): object {
  const expanded = expandLabels(filterDrawElements(elements));
  const drawElements = applyDefaults(expanded);
  return {
    type: "excalidraw",
    version: 2,
    source: "excalidraw-cli",
    elements: drawElements,
    appState: {
      viewBackgroundColor: "#ffffff",
      gridSize: null,
    },
    files: {},
  };
}

export interface CreateDiagramResult {
  /** The complete .excalidraw file data */
  file: object;
  /** The fully resolved elements (including pseudo-elements) */
  elements: any[];
  /** The checkpoint ID for this diagram */
  checkpointId: string;
  /** Any warnings about the diagram */
  warnings: string[];
}

/**
 * Create a diagram from elements JSON string.
 * Resolves checkpoints, processes deletions, validates cameras, and saves state.
 */
export async function createDiagram(
  elementsJson: string,
  store: CheckpointStore,
): Promise<CreateDiagramResult> {
  const parsed = parseElements(elementsJson);
  const { elements, warnings } = await resolveElements(parsed, store);
  const checkpointId = generateCheckpointId();
  const checkpointData: CheckpointData = { elements: filterDrawElements(elements) };
  await store.save(checkpointId, checkpointData);

  const file = buildExcalidrawFile(elements);

  return { file, elements, checkpointId, warnings };
}
