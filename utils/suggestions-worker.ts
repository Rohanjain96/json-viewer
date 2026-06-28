import { JSONPath } from "jsonpath-plus";

interface SuggestionsRequest {
  id: number;
  json: unknown;
  query: string;
}

self.onmessage = (e: MessageEvent<SuggestionsRequest>) => {
  const { id, json, query } = e.data;

  try {
    const suggs: string[] = [];

    if (!query || !query.startsWith("$") || !json || typeof json !== "object") {
      self.postMessage({ id, suggestions: [] });
      return;
    }

    // Case 0: opening a filter
    if (query.endsWith("[?(")) {
      suggs.push(query + "@.");
    } else if (query.endsWith("[?(@")) {
      suggs.push(query + ".");
    }

    // Case A: trailing "[" — suggest array subscripts
    else if (query.endsWith("[")) {
      const base = query.slice(0, -1);
      const raw = JSONPath({
        path: base,
        json,
        resultType: "value",
        wrap: true,
      });
      const node = raw?.[0];
      if (Array.isArray(node)) {
        suggs.push(base + "[*]");
        suggs.push(base + "[0]");
        if (node.length > 1) suggs.push(base + `[${node.length - 1}]`);
        suggs.push(base + "[?(");
      }
    }

    // Case C: inside filter [?(@.field — MUST be before Case B
    else if (query.match(/\[\?\(@\./)) {
      const filterMatch = query.match(/^(.*)\[\?\(@\.([\w]*)$/);
      if (filterMatch) {
        const arrayPath = filterMatch[1];
        const partial = filterMatch[2].toLowerCase();

        const raw = JSONPath({
          path: arrayPath,
          json,
          resultType: "value",
          wrap: true,
        });
        const keySet = new Set<string>();
        const sampleValues: Record<string, unknown> = {};

        (raw || []).slice(0, 1).forEach((node: unknown) => {
          if (Array.isArray(node)) {
            node.slice(0, 5).forEach((item: unknown) => {
              if (item && typeof item === "object" && !Array.isArray(item)) {
                Object.entries(item as Record<string, unknown>).forEach(
                  ([k, v]) => {
                    if (
                      v !== null &&
                      typeof v === "object" &&
                      !Array.isArray(v)
                    ) {
                      Object.entries(v as Record<string, unknown>).forEach(
                        ([nk, nv]) => {
                          if (nv === null || typeof nv !== "object") {
                            const dotKey = `${k}.${nk}`;
                            keySet.add(dotKey);
                            if (!(dotKey in sampleValues))
                              sampleValues[dotKey] = nv;
                          }
                        },
                      );
                    } else if (!Array.isArray(v)) {
                      keySet.add(k);
                      if (!(k in sampleValues)) sampleValues[k] = v;
                    }
                  },
                );
              }
            });
          }
        });

        for (const key of keySet) {
          if (key.toLowerCase().startsWith(partial)) {
            suggs.push(`${arrayPath}[?(@.${key})]`);
          }
        }
      }
    }

    // Case B: trailing "." or partial key — suggest child keys
    else {
      const bracketDot = query.match(/^(.*\[\*\])\.([\w]*)$/);
      const normalDot = query.match(/^(.*)\.([\w]*)$/);
      const m = bracketDot || normalDot;

      if (m) {
        const parentPath = m[1] || "$";
        const partial = m[2].toLowerCase();

        const raw = JSONPath({
          path: parentPath,
          json,
          resultType: "value",
          wrap: true,
        });
        const keySet = new Set<string>();

        (raw || []).slice(0, 20).forEach((node: unknown) => {
          if (node && typeof node === "object" && !Array.isArray(node)) {
            Object.keys(node as object).forEach((k) => keySet.add(k));
          } else if (Array.isArray(node)) {
            suggs.push(parentPath + "[*]");
            suggs.push(parentPath + "[0]");
            suggs.push(parentPath + "[?(");
          }
        });

        for (const key of keySet) {
          if (key.toLowerCase().startsWith(partial)) {
            const full = parentPath + "." + key;
            if (full !== query) suggs.push(full);
          }
        }
      }
    }

    // Deduplicate + sort exact prefix matches first
    const unique = [...new Set(suggs)];
    unique.sort((a, b) => {
      const aMatch = a.toLowerCase().startsWith(query.toLowerCase()) ? 0 : 1;
      const bMatch = b.toLowerCase().startsWith(query.toLowerCase()) ? 0 : 1;
      return aMatch - bMatch || a.localeCompare(b);
    });

    self.postMessage({ id, suggestions: unique.slice(0, 12) });
  } catch {
    self.postMessage({ id, suggestions: [] });
  }
};
