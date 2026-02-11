import { Command, Option } from "commander";
import { createRequire } from "node:module";
import { printBanner } from "./utils/banner.js";
import { createCommand } from "./commands/create.js";
import { exportCommand } from "./commands/export.js";
import { referenceCommand } from "./commands/reference.js";
import { checkpointCommand } from "./commands/checkpoint.js";

const require = createRequire(import.meta.url);
const pkg = require("../package.json") as { version: string };

const program = new Command()
  .name("excalidraw")
  .description("Excalidraw CLI — create hand-drawn diagrams from the command line")
  .version(pkg.version, "-v, --version")
  .addOption(new Option("--no-banner").hideHelp())
  .hook("preAction", (thisCommand) => {
    const opts = thisCommand.opts();
    if (opts.banner !== false) {
      printBanner();
    }
  });

program.addCommand(createCommand());
program.addCommand(exportCommand());
program.addCommand(referenceCommand());
program.addCommand(checkpointCommand());

program.parse();
