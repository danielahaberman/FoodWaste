// Wait until the local API is reachable before starting Vite.
// This prevents noisy Vite proxy ECONNREFUSED errors on startup.

const DEFAULT_URL = 'http://localhost:5001/health';
const url = process.env.WAIT_FOR_API_URL || DEFAULT_URL;

const timeoutMs = Number.parseInt(process.env.WAIT_FOR_API_TIMEOUT_MS || '', 10) || 30000;
const intervalMs = Number.parseInt(process.env.WAIT_FOR_API_INTERVAL_MS || '', 10) || 300;
const requestTimeoutMs = Number.parseInt(process.env.WAIT_FOR_API_REQUEST_TIMEOUT_MS || '', 10) || 1500;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function tryFetchOnce() {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), requestTimeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
    if (!res.ok) return { ok: false, status: res.status };
    return { ok: true, status: res.status };
  } catch (err) {
    return { ok: false, error: err };
  } finally {
    clearTimeout(t);
  }
}

const start = Date.now();
let lastErr = null;

// eslint-disable-next-line no-constant-condition
while (true) {
  const elapsed = Date.now() - start;
  if (elapsed > timeoutMs) {
    console.error(`[wait-for-api] Timed out after ${timeoutMs}ms waiting for ${url}`);
    if (lastErr) console.error('[wait-for-api] Last error:', lastErr);
    process.exit(1);
  }

  const result = await tryFetchOnce();
  if (result.ok) {
    console.log(`[wait-for-api] API is up (${result.status}) at ${url}`);
    process.exit(0);
  }

  lastErr = result.error || result;
  await sleep(intervalMs);
}

