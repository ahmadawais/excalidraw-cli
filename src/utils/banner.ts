import pc from "picocolors";

/**
 * ASCII art banner for the CLI using ANSI Shadow style.
 * Displayed at startup, ~150px wide.
 */
const BANNER_LARGE = `
███████╗██╗  ██╗ ██████╗ █████╗ ██╗     ██╗██████╗ ██████╗  █████╗ ██╗    ██╗
██╔════╝╚██╗██╔╝██╔════╝██╔══██╗██║     ██║██╔══██╗██╔══██╗██╔══██╗██║    ██║
█████╗   ╚███╔╝ ██║     ███████║██║     ██║██║  ██║██████╔╝███████║██║ █╗ ██║
██╔══╝   ██╔██╗ ██║     ██╔══██║██║     ██║██║  ██║██╔══██╗██╔══██║██║███╗██║
███████╗██╔╝ ██╗╚██████╗██║  ██║███████╗██║██████╔╝██║  ██║██║  ██║╚███╔███╔╝
╚══════╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚══════╝╚═╝╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝ ╚══╝╚══╝ `;

/**
 * Compact ASCII art banner for smaller terminals.
 */
const BANNER_COMPACT = `
 ____          _ _    _
| ___|_  _____| (_)__| |_ __ ___      __
|  _|\\ \\/ / __| | / _\` | '__/ _\` \\ /\\ / /
| |___>  < (__| | | (_| | | | (_| \\ V  V /
|____/_/\\_\\___|_|_|\\__,_|_|  \\__,_|\\_/\\_/ `;

/**
 * Print the ASCII art welcome banner.
 * Uses large banner for wide terminals, compact for narrow ones.
 */
export function printBanner(): void {
  const cols = process.stdout.columns ?? 80;
  const banner = cols >= 90 ? BANNER_LARGE : BANNER_COMPACT;
  console.log(pc.white(banner));
  console.log(pc.gray("  Hand-drawn diagrams from the command line\n"));
}
