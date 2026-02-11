import { describe, it, expect } from "vitest";
import {
  parseElements,
  checkCameraAspectRatio,
  resolveElements,
  filterDrawElements,
  generateCheckpointId,
  buildExcalidrawFile,
  expandLabels,
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

describe("expandLabels", () => {
  it("expands label on rectangle into bound text element", () => {
    const elements = [
      { type: "rectangle", id: "r1", x: 100, y: 100, width: 200, height: 80, label: { text: "Hello", fontSize: 20 } },
    ];
    const result = expandLabels(elements);
    expect(result).toHaveLength(2);
    expect(result[0].type).toBe("rectangle");
    expect(result[0].label).toBeUndefined();
    expect(result[0].boundElements).toEqual([{ id: "r1_label", type: "text" }]);
    expect(result[1].type).toBe("text");
    expect(result[1].id).toBe("r1_label");
    expect(result[1].text).toBe("Hello");
    expect(result[1].fontSize).toBe(20);
    expect(result[1].containerId).toBe("r1");
    expect(result[1].textAlign).toBe("center");
    expect(result[1].verticalAlign).toBe("middle");
  });

  it("expands label on arrow", () => {
    const elements = [
      { type: "arrow", id: "a1", x: 100, y: 100, width: 200, height: 0, label: { text: "connects" } },
    ];
    const result = expandLabels(elements);
    expect(result).toHaveLength(2);
    expect(result[0].type).toBe("arrow");
    expect(result[0].boundElements).toEqual([{ id: "a1_label", type: "text" }]);
    expect(result[1].containerId).toBe("a1");
    expect(result[1].text).toBe("connects");
  });

  it("preserves existing boundElements when adding label", () => {
    const elements = [
      { type: "rectangle", id: "r1", x: 100, y: 100, width: 200, height: 80, boundElements: [{ id: "a1", type: "arrow" }], label: { text: "Box" } },
    ];
    const result = expandLabels(elements);
    expect(result[0].boundElements).toHaveLength(2);
    expect(result[0].boundElements[0]).toEqual({ id: "a1", type: "arrow" });
    expect(result[0].boundElements[1]).toEqual({ id: "r1_label", type: "text" });
  });

  it("passes through elements without labels unchanged", () => {
    const elements = [
      { type: "rectangle", id: "r1", x: 100, y: 100, width: 200, height: 80 },
      { type: "text", id: "t1", x: 0, y: 0, text: "hi" },
    ];
    const result = expandLabels(elements);
    expect(result).toHaveLength(2);
    expect(result).toEqual(elements);
  });

  it("expands label on diamond and ellipse", () => {
    const elements = [
      { type: "diamond", id: "d1", x: 0, y: 0, width: 150, height: 150, label: { text: "Decision" } },
      { type: "ellipse", id: "e1", x: 0, y: 0, width: 150, height: 150, label: { text: "Circle" } },
    ];
    const result = expandLabels(elements);
    expect(result).toHaveLength(4);
    expect(result[1].containerId).toBe("d1");
    expect(result[3].containerId).toBe("e1");
  });

  it("uses default fontSize 20 when not specified", () => {
    const elements = [
      { type: "rectangle", id: "r1", x: 0, y: 0, width: 200, height: 80, label: { text: "Test" } },
    ];
    const result = expandLabels(elements);
    expect(result[1].fontSize).toBe(20);
  });

  it("passes strokeColor from label to text element", () => {
    const elements = [
      { type: "rectangle", id: "r1", x: 0, y: 0, width: 200, height: 80, label: { text: "Dark", strokeColor: "#e5e5e5" } },
    ];
    const result = expandLabels(elements);
    expect(result[1].strokeColor).toBe("#e5e5e5");
  });
});

describe("buildExcalidrawFile — label expansion", () => {
  it("expands labels in the final file output", () => {
    const elements = [
      { type: "rectangle", id: "r1", x: 100, y: 100, width: 200, height: 80, label: { text: "Hello" } },
    ];
    const file = buildExcalidrawFile(elements) as any;
    expect(file.elements).toHaveLength(2);
    expect(file.elements[0].type).toBe("rectangle");
    expect(file.elements[0].label).toBeUndefined();
    expect(file.elements[1].type).toBe("text");
    expect(file.elements[1].containerId).toBe("r1");
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
