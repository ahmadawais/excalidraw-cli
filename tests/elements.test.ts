import { describe, it, expect } from "vitest";
import {
  parseElements,
  checkCameraAspectRatio,
  resolveElements,
  filterDrawElements,
  generateCheckpointId,
  buildExcalidrawFile,
  createDiagram,
} from "../src/lib/elements.js";
import { MemoryCheckpointStore } from "../src/lib/checkpoint.js";

describe("parseElements", () => {
  it("parses valid JSON array", () => {
    const result = parseElements('[{"type":"rectangle","id":"r1","x":0,"y":0,"width":100,"height":50}]');
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("rectangle");
  });

  it("throws on invalid JSON", () => {
    expect(() => parseElements("{not valid")).toThrow("Invalid JSON");
  });

  it("throws on non-array JSON", () => {
    expect(() => parseElements('{"type":"rectangle"}')).toThrow("must be a JSON array");
  });
});

describe("checkCameraAspectRatio", () => {
  it("returns empty string for valid 4:3 camera", () => {
    const result = checkCameraAspectRatio([
      { type: "cameraUpdate", width: 800, height: 600, x: 0, y: 0 },
    ]);
    expect(result).toBe("");
  });

  it("returns warning for non-4:3 camera", () => {
    const result = checkCameraAspectRatio([
      { type: "cameraUpdate", width: 800, height: 400, x: 0, y: 0 },
    ]);
    expect(result).toContain("Warning");
    expect(result).toContain("800x400");
  });

  it("ignores non-camera elements", () => {
    const result = checkCameraAspectRatio([
      { type: "rectangle", id: "r1", x: 0, y: 0, width: 100, height: 50 },
    ]);
    expect(result).toBe("");
  });
});

describe("filterDrawElements", () => {
  it("removes pseudo-elements", () => {
    const elements = [
      { type: "cameraUpdate", width: 800, height: 600 },
      { type: "rectangle", id: "r1", x: 0, y: 0, width: 100, height: 50 },
      { type: "delete", ids: "r1" },
      { type: "restoreCheckpoint", id: "abc" },
      { type: "arrow", id: "a1", x: 0, y: 0, width: 100, height: 0 },
    ];
    const result = filterDrawElements(elements);
    expect(result).toHaveLength(2);
    expect(result[0].type).toBe("rectangle");
    expect(result[1].type).toBe("arrow");
  });
});

describe("generateCheckpointId", () => {
  it("generates 18-character alphanumeric IDs", () => {
    const id = generateCheckpointId();
    expect(id).toHaveLength(18);
    expect(id).toMatch(/^[a-f0-9]+$/);
  });

  it("generates unique IDs", () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateCheckpointId()));
    expect(ids.size).toBe(100);
  });
});

describe("buildExcalidrawFile", () => {
  it("builds valid excalidraw file structure", () => {
    const elements = [
      { type: "cameraUpdate", width: 800, height: 600 },
      { type: "rectangle", id: "r1", x: 0, y: 0, width: 100, height: 50 },
    ];
    const file = buildExcalidrawFile(elements) as any;
    expect(file.type).toBe("excalidraw");
    expect(file.version).toBe(2);
    expect(file.source).toBe("excalidraw-cli");
    expect(file.elements).toHaveLength(1); // camera filtered out
    expect(file.elements[0].type).toBe("rectangle");
    expect(file.appState.viewBackgroundColor).toBe("#ffffff");
  });
});

describe("resolveElements", () => {
  it("filters delete pseudo-elements in simple mode", async () => {
    const store = new MemoryCheckpointStore();
    const elements = [
      { type: "rectangle", id: "r1", x: 0, y: 0, width: 100, height: 50 },
      { type: "delete", ids: "r1" },
      { type: "rectangle", id: "r2", x: 0, y: 0, width: 100, height: 50 },
    ];
    const result = await resolveElements(elements, store);
    // Delete pseudo-elements are removed, but the delete doesn't remove r1 without a restoreCheckpoint
    // In simple mode (no restoreCheckpoint), deletes are just filtered out
    expect(result.elements).toHaveLength(2);
    expect(result.elements[0].id).toBe("r1");
    expect(result.elements[1].id).toBe("r2");
  });

  it("restores from checkpoint and applies deletes", async () => {
    const store = new MemoryCheckpointStore();
    await store.save("test-cp", {
      elements: [
        { type: "rectangle", id: "r1", x: 0, y: 0, width: 100, height: 50 },
        { type: "rectangle", id: "r2", x: 200, y: 0, width: 100, height: 50 },
      ],
    });

    const elements = [
      { type: "restoreCheckpoint", id: "test-cp" },
      { type: "delete", ids: "r1" },
      { type: "rectangle", id: "r3", x: 400, y: 0, width: 100, height: 50 },
    ];

    const result = await resolveElements(elements, store);
    expect(result.elements).toHaveLength(2);
    expect(result.elements[0].id).toBe("r2");
    expect(result.elements[1].id).toBe("r3");
  });

  it("throws on missing checkpoint", async () => {
    const store = new MemoryCheckpointStore();
    const elements = [{ type: "restoreCheckpoint", id: "nonexistent" }];
    await expect(resolveElements(elements, store)).rejects.toThrow("not found");
  });
});

describe("createDiagram", () => {
  it("creates a diagram and saves checkpoint", async () => {
    const store = new MemoryCheckpointStore();
    const json = JSON.stringify([
      { type: "cameraUpdate", width: 800, height: 600, x: 0, y: 0 },
      { type: "rectangle", id: "r1", x: 100, y: 100, width: 200, height: 100 },
    ]);

    const result = await createDiagram(json, store);
    expect(result.checkpointId).toHaveLength(18);
    expect((result.file as any).type).toBe("excalidraw");
    expect((result.file as any).elements).toHaveLength(1);

    // Verify checkpoint was saved
    const loaded = await store.load(result.checkpointId);
    expect(loaded).not.toBeNull();
    expect(loaded!.elements).toHaveLength(1);
  });
});
