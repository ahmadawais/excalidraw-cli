import { Command } from "commander";
import pc from "picocolors";
import fs from "node:fs";
import ora from "ora";
import {
  createDiagram,
  parseElements,
  buildExcalidrawFile,
  filterDrawElements,
} from "../lib/elements.js";
import { FileCheckpointStore } from "../lib/checkpoint.js";

export function createCommand(): Command {
  const cmd = new Command("create")
    .description("Create an Excalidraw diagram from JSON elements")
    .argument("[input]", "Input JSON file path (or use --json for inline JSON)")
    .option("-j, --json <elements>", "Inline JSON string of elements array")
    .option(
      "-o, --output <file>",
      "Output file path (default: diagram.excalidraw)",
      "diagram.excalidraw",
    )
    .option(
      "--checkpoint-dir <dir>",
      "Directory for checkpoint storage",
    )
    .option("--no-checkpoint", "Skip saving a checkpoint")
    .action(async (input: string | undefined, opts) => {
      let elementsJson: string;

      if (opts.json) {
        elementsJson = opts.json;
      } else if (input) {
        if (!fs.existsSync(input)) {
          console.error(pc.red(`Error: File not found: ${input}`));
          process.exit(1);
        }
        elementsJson = fs.readFileSync(input, "utf-8");

        // If input is a .excalidraw file, extract elements array
        try {
          const parsed = JSON.parse(elementsJson);
          if (parsed.type === "excalidraw" && Array.isArray(parsed.elements)) {
            elementsJson = JSON.stringify(parsed.elements);
          }
        } catch {
          // Not a .excalidraw file, treat as raw elements JSON
        }
      } else if (!process.stdin.isTTY) {
        // Read from stdin (cross-platform)
        const chunks: Buffer[] = [];
        for await (const chunk of process.stdin) {
          chunks.push(Buffer.from(chunk as Buffer));
        }
        elementsJson = Buffer.concat(chunks).toString("utf-8");
      } else {
        console.error(
          pc.red(
            "Error: Provide an input file, --json flag, or pipe JSON to stdin",
          ),
        );
        process.exit(1);
      }

      const spinner = ora("Creating diagram...").start();

      try {
        if (opts.checkpoint === false) {
          // Simple mode: just parse and build file, no checkpoint
          const elements = parseElements(elementsJson);
          const file = buildExcalidrawFile(elements);
          fs.writeFileSync(opts.output, JSON.stringify(file, null, 2));
          spinner.succeed(
            pc.green(`Diagram saved to ${pc.bold(opts.output)}`),
          );
        } else {
          const store = new FileCheckpointStore(opts.checkpointDir);
          const result = await createDiagram(elementsJson, store);
          fs.writeFileSync(
            opts.output,
            JSON.stringify(result.file, null, 2),
          );

          spinner.succeed(
            pc.green(`Diagram saved to ${pc.bold(opts.output)}`),
          );
          console.log(
            pc.gray(`  Checkpoint: ${pc.white(result.checkpointId)}`),
          );

          if (result.warnings.length > 0) {
            for (const w of result.warnings) {
              console.log(pc.yellow(`  ⚠ ${w}`));
            }
          }
        }

        // Show element summary
        const elements = parseElements(elementsJson);
        const drawEls = filterDrawElements(elements);
        const types = drawEls.reduce(
          (acc: Record<string, number>, el: any) => {
            acc[el.type] = (acc[el.type] || 0) + 1;
            return acc;
          },
          {},
        );
        const summary = Object.entries(types)
          .map(([t, n]) => `${n} ${t}${n > 1 ? "s" : ""}`)
          .join(", ");
        if (summary) {
          console.log(pc.gray(`  Elements: ${summary}`));
        }
      } catch (e) {
        spinner.fail(pc.red(`Failed: ${(e as Error).message}`));
        process.exit(1);
      }
    });

  return cmd;
}
