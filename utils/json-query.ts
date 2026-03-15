import { JSONPath } from "jsonpath-plus";
import { JSONValue } from "../types/json";
import { QueryResult, QueryMatch } from "@/types/query";

interface RawJSONPathResult {
  value: JSONValue;
  path: string;
}

export function queryJSON(data: JSONValue, path: string): QueryResult {
  if (!path.startsWith("$")) {
    return { type: "error", error: "Path must start with $" };
  }

  try {
    const raw = JSONPath({
      path,
      json: data,
      resultType: "all",
      wrap: true,
    }) as RawJSONPathResult[];

    const results: QueryMatch[] = raw.map((r) => {
      const formatted = r.path
        .replace(/\['([^']+)'\]/g, ".$1")
        .replace(/^\$\./, "$.");

      return {
        value: r.value,
        path: formatted,
      };
    });

    return { type: "success", results };
  } catch (e) {
    return {
      type: "error",
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}
