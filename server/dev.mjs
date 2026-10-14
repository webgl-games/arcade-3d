// Dev launcher: starts the multiplayer relay in-process, then runs `next dev`.
// `npm run dev` therefore gives you both the site AND online play.
import { spawn } from "node:child_process";
import { startMPServer } from "./mp-server.mjs";

try { startMPServer(); } catch (e) { console.log("[mp] not started:", e.code || e.message); }

const child = spawn("npx", ["next", "dev"], { stdio: "inherit", env: process.env });
child.on("exit", (code) => process.exit(code ?? 0));
for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => child.kill(sig));
