import { Command } from "commander";
import pc from "picocolors";
import fs from "node:fs";
import ora from "ora";
import { exportToUrl } from "../lib/export.js";

export function exportCommand(): Command {
  const cmd = new Command("export")
    .description("Export an Excalidraw file to excalidraw.com shareable URL")
    .argument("<file>", "Path to .excalidraw file")
    .action(async (file: string) => {
      if (!fs.existsSync(file)) {
        console.error(pc.red(`Error: File not found: ${file}`));
        process.exit(1);
      }

      const spinner = ora("Uploading to excalidraw.com...").start();

      try {
        const json = fs.readFileSync(file, "utf-8");

        // Validate it's valid JSON
        JSON.parse(json);

        const url = await exportToUrl(json);
        spinner.succeed(pc.green("Uploaded successfully!"));
        console.log(pc.white(`\n  ${pc.bold("URL:")} ${pc.cyan(url)}\n`));
      } catch (e) {
        spinner.fail(pc.red(`Export failed: ${(e as Error).message}`));
        process.exit(1);
      }
    });

  return cmd;
}
