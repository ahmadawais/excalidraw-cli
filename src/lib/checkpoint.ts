import fs from "node:fs";
import path from "node:path";
import os from "node:os";

/**
 * Checkpoint data structure for saving and loading diagram state.
 */
export interface CheckpointData {
  elements: any[];
}

/**
 * Interface for checkpoint storage backends.
 */
export interface CheckpointStore {
  save(id: string, data: CheckpointData): Promise<void>;
  load(id: string): Promise<CheckpointData | null>;
  list(): Promise<string[]>;
  remove(id: string): Promise<boolean>;
}

/**
 * File-based checkpoint store that persists diagrams as JSON files on disk.
 */
export class FileCheckpointStore implements CheckpointStore {
  private dir: string;

  constructor(dir?: string) {
    this.dir =
      dir ??
      process.env.EXCALIDRAW_CHECKPOINT_DIR ??
      path.join(os.homedir(), ".excalidraw", "checkpoints");
    fs.mkdirSync(this.dir, { recursive: true });
  }

  async save(id: string, data: CheckpointData): Promise<void> {
    const filePath = path.join(this.dir, `${id}.json`);
    await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2));
  }

  async load(id: string): Promise<CheckpointData | null> {
    try {
      const filePath = path.join(this.dir, `${id}.json`);
      const raw = await fs.promises.readFile(filePath, "utf-8");
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  async list(): Promise<string[]> {
    try {
      const files = await fs.promises.readdir(this.dir);
      return files
        .filter((f) => f.endsWith(".json"))
        .map((f) => f.replace(/\.json$/, ""));
    } catch {
      return [];
    }
  }

  async remove(id: string): Promise<boolean> {
    try {
      const filePath = path.join(this.dir, `${id}.json`);
      await fs.promises.unlink(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * In-memory checkpoint store for testing and ephemeral use.
 */
export class MemoryCheckpointStore implements CheckpointStore {
  private store = new Map<string, string>();

  async save(id: string, data: CheckpointData): Promise<void> {
    this.store.set(id, JSON.stringify(data));
  }

  async load(id: string): Promise<CheckpointData | null> {
    const raw = this.store.get(id);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  async list(): Promise<string[]> {
    return [...this.store.keys()];
  }

  async remove(id: string): Promise<boolean> {
    return this.store.delete(id);
  }
}
