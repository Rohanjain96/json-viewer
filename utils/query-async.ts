import { JSONValue } from "@/types/json";
import { QueryResult } from "@/types/query";

let worker: Worker | null = null;
let nextId = 0;
const pending = new Map<number, (result: QueryResult) => void>();

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL("./query-worker.ts", import.meta.url));
    worker.onmessage = (e: MessageEvent<{ id: number } & QueryResult>) => {
      const resolve = pending.get(e.data.id);
      if (resolve) {
        pending.delete(e.data.id);
        const { id: _id, ...result } = e.data;
        resolve(result as QueryResult);
      }
    };
  }
  return worker;
}

export function queryAsync(data: JSONValue, path: string): Promise<QueryResult> {
  return new Promise(resolve => {
    const id = nextId++;
    pending.set(id, resolve);
    getWorker().postMessage({ id, data, path });
  });
}