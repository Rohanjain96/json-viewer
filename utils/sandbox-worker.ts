import { runSandbox } from "./js-sandbox";

interface SandboxRequest {
  id: number;
  code: string;
  data: unknown;
}

self.onmessage = (e: MessageEvent<SandboxRequest>) => {
  const { id, code, data } = e.data;
  const result = runSandbox(code, data);
  self.postMessage({ id, ...result });
};
