let worker: Worker | null = null;

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL("./json-worker.ts", import.meta.url));
  }
  return worker;
}

export function parseAsync(text: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const w = getWorker();
    const handler = (e: MessageEvent) => {
      w.removeEventListener("message", handler);
      if (e.data.ok) resolve(e.data.parsed);
      else reject(new Error(e.data.error));
    };
    w.addEventListener("message", handler);
    w.postMessage(text);
  });
}