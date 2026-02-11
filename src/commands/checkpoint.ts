import { Command } from "commander";
import pc from "picocolors";
import fs from "node:fs";
import ora from "ora";
import { FileCheckpointStore } from "../lib/checkpoint.js";

export function checkpointCommand(): Command {
  const cmd = new Command("checkpoint")
    .alias("cp")
    .description("Manage diagram checkpoints (save, load, list, remove)");

  cmd
    .command("list")
    .alias("ls")
    .description("List all saved checkpoints")
    .option("--checkpoint-dir <dir>", "Directory for checkpoint storage")
    .action(async (opts) => {
      const store = new FileCheckpointStore(opts.checkpointDir);
      const ids = await store.list();

      if (ids.length === 0) {
        console.log(pc.gray("No checkpoints found."));
        return;
      }

      console.log(pc.bold(pc.white(`\n  Checkpoints (${ids.length}):\n`)));
      for (const id of ids) {
        const data = await store.load(id);
        const count = data?.elements?.length ?? 0;
        console.log(
          pc.white(`  ${pc.bold(id)}`) +
            pc.gray(` — ${count} element${count !== 1 ? "s" : ""}`),
        );
      }
      console.log();
    });

  cmd
    .command("save <id> <file>")
    .description("Save a .excalidraw file as a named checkpoint")
    .option("--checkpoint-dir <dir>", "Directory for checkpoint storage")
    .action(async (id: string, file: string, opts) => {
      if (!fs.existsSync(file)) {
        console.error(pc.red(`Error: File not found: ${file}`));
        process.exit(1);
      }

      const spinner = ora("Saving checkpoint...").start();

      try {
        const raw = fs.readFileSync(file, "utf-8");
        const parsed = JSON.parse(raw);
        const elements = Array.isArray(parsed)
          ? parsed
          : parsed.elements ?? [];

        const store = new FileCheckpointStore(opts.checkpointDir);
        await store.save(id, { elements });

        spinner.succeed(
          pc.green(
            `Checkpoint ${pc.bold(id)} saved (${elements.length} elements)`,
          ),
        );
      } catch (e) {
        spinner.fail(pc.red(`Failed: ${(e as Error).message}`));
        process.exit(1);
      }
    });

  cmd
    .command("load <id>")
    .description("Load a checkpoint and output as .excalidraw JSON")
    .option("-o, --output <file>", "Output file path")
    .option("--checkpoint-dir <dir>", "Directory for checkpoint storage")
    .action(async (id: string, opts) => {
      const store = new FileCheckpointStore(opts.checkpointDir);
      const data = await store.load(id);

      if (!data) {
        console.error(pc.red(`Checkpoint "${id}" not found.`));
        process.exit(1);
      }

      const file = {
        type: "excalidraw",
        version: 2,
        source: "excalidraw-cli",
        elements: data.elements,
        appState: { viewBackgroundColor: "#ffffff", gridSize: null },
        files: {},
      };

      const json = JSON.stringify(file, null, 2);

      if (opts.output) {
        fs.writeFileSync(opts.output, json);
        console.log(
          pc.green(
            `Checkpoint ${pc.bold(id)} saved to ${pc.bold(opts.output)}`,
          ),
        );
      } else {
        console.log(json);
      }
    });

  cmd
    .command("remove <id>")
    .alias("rm")
    .description("Remove a checkpoint")
    .option("--checkpoint-dir <dir>", "Directory for checkpoint storage")
    .action(async (id: string, opts) => {
      const store = new FileCheckpointStore(opts.checkpointDir);
      const removed = await store.remove(id);

      if (removed) {
        console.log(pc.green(`Checkpoint ${pc.bold(id)} removed.`));
      } else {
        console.error(pc.red(`Checkpoint "${id}" not found.`));
        process.exit(1);
      }
    });

  return cmd;
}
