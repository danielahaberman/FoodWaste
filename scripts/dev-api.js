// Start the backend API for dev, but don't crash if it's already running.
// This prevents EADDRINUSE when multiple terminals run `npm run dev`.

import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const API_HEALTH_URL = process.env.WAIT_FOR_API_URL || "http://localhost:5001/health";
const CHECK_TIMEOUT_MS = Number.parseInt(process.env.DEV_API_CHECK_TIMEOUT_MS || "", 10) || 1200;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function isApiUp() {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);
  try {
    const res = await fetch(API_HEALTH_URL, { signal: controller.signal });
    return !!res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(t);
  }
}

async function main() {
  // Quick pre-check: if API already running, keep this process alive.
  if (await isApiUp()) {
    console.log(`[dev:api] API already running at ${API_HEALTH_URL} (not starting another)`);
    console.log("[dev:api] Press Ctrl+C to stop dev session.");
    // Keep the process alive so `concurrently` doesn't treat it as finished.
    // (No-op heartbeat)
    // eslint-disable-next-line no-constant-condition
    while (true) {
      await sleep(60_000);
    }
  }

  const serverDir = path.resolve(__dirname, "..", "server");
  const nodeExec = process.execPath;
  const child = spawn(nodeExec, ["index.js"], {
    cwd: serverDir,
    stdio: "inherit",
    windowsHide: true,
  });

  child.on("exit", (code) => process.exit(code ?? 0));
  child.on("error", (err) => {
    console.error("[dev:api] Failed to start API:", err);
    process.exit(1);
  });
}

main().catch((err) => {
  console.error("[dev:api] Unexpected error:", err);
  process.exit(1);
});

