import { JSONValue } from "../types/json";

export type DiffType = "added" | "removed" | "changed";

export interface DiffChange {
  path: string;
  type: DiffType;
  from?: JSONValue;
  to?: JSONValue;
  value?: JSONValue;
}

export function diffJSON(a: JSONValue, b: JSONValue, path = ""): DiffChange[] {
  const changes: DiffChange[] = [];

  if (typeof a !== typeof b) {
    changes.push({ path, type: "changed", from: a, to: b });
    return changes;
  }

  if (Array.isArray(a) !== Array.isArray(b)) {
    changes.push({ path, type: "changed", from: a, to: b });
    return changes;
  }

  if (typeof a === "object" && a !== null && b !== null) {
    const aObj = a as Record<string, JSONValue>;
    const bObj = b as Record<string, JSONValue>;

    const keys = new Set([...Object.keys(aObj), ...Object.keys(bObj)]);

    for (const key of keys) {
      const next = path ? `${path}.${key}` : key;

      if (!(key in aObj)) {
        changes.push({
          path: next,
          type: "added",
          value: bObj[key],
        });
      } else if (!(key in bObj)) {
        changes.push({
          path: next,
          type: "removed",
          value: aObj[key],
        });
      } else {
        changes.push(...diffJSON(aObj[key], bObj[key], next));
      }
    }
  } else if (a !== b) {
    changes.push({
      path,
      type: "changed",
      from: a,
      to: b,
    });
  }

  return changes;
}
