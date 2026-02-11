import { Command } from "commander";
import pc from "picocolors";
import { REFERENCE } from "../lib/reference.js";

export function referenceCommand(): Command {
  const cmd = new Command("reference")
    .alias("ref")
    .description(
      "Show the Excalidraw element format reference (colors, elements, tips)",
    )
    .option("--raw", "Output raw markdown without colors")
    .action((opts) => {
      if (opts.raw) {
        console.log(REFERENCE);
        return;
      }

      // Simple colorized output
      const lines = REFERENCE.split("\n");
      for (const line of lines) {
        if (line.startsWith("# ")) {
          console.log(pc.bold(pc.white(line)));
        } else if (line.startsWith("## ")) {
          console.log(pc.bold(pc.cyan(line)));
        } else if (line.startsWith("### ")) {
          console.log(pc.bold(pc.blue(line)));
        } else if (line.startsWith("**")) {
          console.log(pc.bold(line));
        } else if (line.startsWith("```")) {
          console.log(pc.gray(line));
        } else if (line.startsWith("| ")) {
          console.log(pc.gray(line));
        } else if (line.startsWith("- ")) {
          console.log(pc.white(line));
        } else {
          console.log(line);
        }
      }
    });

  return cmd;
}
