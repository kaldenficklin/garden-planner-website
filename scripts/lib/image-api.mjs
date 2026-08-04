/**
 * Client for the local image-generation API (ComfyUI on the Windows PC).
 *
 * The API is LAN-only, so anything that calls it has to run on a machine on the
 * same network — that is why the daily infographic routine is a launchd job on
 * the Mac rather than a cloud task.
 *
 * The PC is not always on. Rather than failing the run, `waitForApi` blocks
 * until the machine appears, which is what makes an unattended 6am schedule
 * workable: the job wakes, finds nothing, and sits there until the PC is
 * switched on later that day.
 */

const BASE = process.env.IMAGE_API ?? 'http://192.168.0.119:4000';

/** One health probe. Resolves true/false, never throws. */
export async function isUp(timeoutMs = 4000) {
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), timeoutMs);
    const res = await fetch(`${BASE}/api/health`, { signal: ctl.signal });
    clearTimeout(t);
    if (!res.ok) return false;
    const health = await res.json();
    // `ok` only means this HTTP layer is alive; without ComfyUI behind it every
    // generation call would 503, so treat that as down too.
    return health.ok === true && health.comfyReachable === true;
  } catch {
    return false;
  }
}

/**
 * Block until the API answers. Polls every `intervalMs`, giving up after
 * `maxWaitMs` so a job can never wedge forever holding a lock.
 *
 * @returns {Promise<boolean>} true once up, false if it timed out
 */
export async function waitForApi({
  intervalMs = 5 * 60_000,
  maxWaitMs = 20 * 60 * 60_000,
  log = console.log,
} = {}) {
  const started = Date.now();
  let announced = false;
  for (;;) {
    if (await isUp()) {
      if (announced) log(`[image-api] up after ${Math.round((Date.now() - started) / 60_000)}m`);
      return true;
    }
    if (Date.now() - started >= maxWaitMs) {
      log(`[image-api] still down after ${Math.round(maxWaitMs / 3_600_000)}h — giving up for today`);
      return false;
    }
    if (!announced) {
      log(`[image-api] ${BASE} is not reachable (PC asleep or off). Waiting…`);
      announced = true;
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}

/**
 * Generate one image and return it as a Buffer.
 *
 * Always asks for base64 rather than fetching the returned url: the API holds
 * generated images in RAM only and evicts them, so the bytes have to be taken
 * inline or they can vanish before we read them.
 *
 * `realism: false` suppresses the API's DSLR/photography prompt scaffolding,
 * which actively fights an illustration request.
 */
export async function generate({
  prompt,
  quality = 'max',
  width = 1024,
  height = 1024,
  seed,
  realism = false,
  timeoutMs = 10 * 60_000,
}) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  let res;
  try {
    res = await fetch(`${BASE}/api/photo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, quality, width, height, seed, realism, returnBase64: true }),
      signal: ctl.signal,
    });
  } finally {
    clearTimeout(t);
  }

  if (!res.ok) {
    throw new Error(`image-api ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  const data = await res.json();
  const b64 = data.images?.[0]?.base64;
  if (!b64) throw new Error('image-api returned no image');
  return Buffer.from(b64.split(',').pop(), 'base64');
}

export const apiBase = () => BASE;
