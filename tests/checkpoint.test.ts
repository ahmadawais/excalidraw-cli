import { describe, it, expect, beforeEach } from "vitest";
import { MemoryCheckpointStore, FileCheckpointStore } from "../src/lib/checkpoint.js";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

describe("MemoryCheckpointStore", () => {
  let store: MemoryCheckpointStore;

  beforeEach(() => {
    store = new MemoryCheckpointStore();
  });

  it("saves and loads checkpoint data", async () => {
    const data = { elements: [{ type: "rectangle", id: "r1" }] };
    await store.save("test1", data);
    const loaded = await store.load("test1");
    expect(loaded).toEqual(data);
  });

  it("returns null for missing checkpoint", async () => {
    const loaded = await store.load("nonexistent");
    expect(loaded).toBeNull();
  });

  it("lists saved checkpoints", async () => {
    await store.save("a", { elements: [] });
    await store.save("b", { elements: [] });
    const ids = await store.list();
    expect(ids).toContain("a");
    expect(ids).toContain("b");
    expect(ids).toHaveLength(2);
  });

  it("removes a checkpoint", async () => {
    await store.save("to-remove", { elements: [] });
    const removed = await store.remove("to-remove");
    expect(removed).toBe(true);
    const loaded = await store.load("to-remove");
    expect(loaded).toBeNull();
  });

  it("returns false when removing nonexistent checkpoint", async () => {
    const removed = await store.remove("nonexistent");
    expect(removed).toBe(false);
  });
});

describe("FileCheckpointStore", () => {
  let store: FileCheckpointStore;
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "excalidraw-test-"));
    store = new FileCheckpointStore(tmpDir);
  });

  it("saves and loads checkpoint data", async () => {
    const data = { elements: [{ type: "ellipse", id: "e1" }] };
    await store.save("test-file", data);
    const loaded = await store.load("test-file");
    expect(loaded).toEqual(data);
  });

  it("returns null for missing checkpoint", async () => {
    const loaded = await store.load("missing");
    expect(loaded).toBeNull();
  });

  it("lists checkpoint files", async () => {
    await store.save("c1", { elements: [] });
    await store.save("c2", { elements: [] });
    const ids = await store.list();
    expect(ids).toContain("c1");
    expect(ids).toContain("c2");
  });

  it("removes checkpoint file", async () => {
    await store.save("to-delete", { elements: [] });
    const removed = await store.remove("to-delete");
    expect(removed).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, "to-delete.json"))).toBe(false);
  });
});
