import { SandboxResult } from "./js-sandbox";

const TIMEOUT_MS = 4000;

let worker: Worker | null = null;
let nextId = 0;
const pending = new Map<number, { resolve: (result: SandboxResult) => void; timer: ReturnType<typeof setTimeout> }>();

function spawnWorker(): Worker {
  const w = new Worker(new URL("./sandbox-worker.ts", import.meta.url));
  w.onmessage = (e: MessageEvent<{ id: number } & SandboxResult>) => {
    const entry = pending.get(e.data.id);
    if (entry) {
      clearTimeout(entry.timer);
      pending.delete(e.data.id);
      const { id: _id, ...result } = e.data;
      entry.resolve(result as SandboxResult);
    }
  };
  return w;
}

function getWorker(): Worker {
  if (!worker) worker = spawnWorker();
  return worker;
}

// Runs sandbox code off the main thread with a hard timeout. Unlike the JSONPath
// query worker, arbitrary user expressions can genuinely hang (infinite loops,
// runaway recursion) — a hung worker can't be message-interrupted, only killed,
// so on timeout we terminate it outright and let the next run spawn a fresh one.
export function runSandboxAsync(code: string, data: unknown): Promise<SandboxResult> {
  return new Promise(resolve => {
    const id = nextId++;
    const timer = setTimeout(() => {
      pending.delete(id);
      worker?.terminate();
      worker = null;
      resolve({
        type: "error",
        error: `Timed out after ${TIMEOUT_MS / 1000}s — the expression likely has an infinite loop or is too expensive to run in the browser.`,
      });
    }, TIMEOUT_MS);
    pending.set(id, { resolve, timer });
    getWorker().postMessage({ id, code, data });
  });
}
