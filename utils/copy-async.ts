let worker: Worker | null = null;

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL("./copy-worker.ts", import.meta.url));
  }
  return worker;
}

export function stringifyAsync(value: unknown, indent = 2): Promise<string> {
  return new Promise((resolve, reject) => {
    const w = getWorker();
    const handler = (e: MessageEvent) => {
      w.removeEventListener("message", handler);
      if (e.data.ok) resolve(e.data.str);
      else reject(new Error(e.data.error));
    };
    w.addEventListener("message", handler);
    w.postMessage({ value, indent });
  });
}
