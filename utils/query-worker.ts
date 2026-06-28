import { JSONPath } from "jsonpath-plus";

interface QueryRequest {
  id: number;
  data: unknown;
  path: string;
}

interface QueryMatch {
  value: unknown;
  path: string;
}

self.onmessage = (e: MessageEvent<QueryRequest>) => {
  const { id, data, path } = e.data;

  if (!path.startsWith("$")) {
    self.postMessage({ id, type: "error", error: "Path must start with $" });
    return;
  }

  try {
    const raw = JSONPath({
      path,
      json: data,
      resultType: "all",
      wrap: true,
    }) as Array<{ value: unknown; path: string }>;

    const results: QueryMatch[] = raw.map((r) => ({
      value: r.value,
      path: r.path
        .replace(/\['([^']+)'\]/g, ".$1")
        .replace(/^\$\./, "$."),
    }));

    self.postMessage({ id, type: "success", results });
  } catch (e) {
    self.postMessage({
      id,
      type: "error",
      error: e instanceof Error ? e.message : "Unknown error",
    });
  }
};