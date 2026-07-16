export interface SandboxResult {
  type: "success" | "error";
  value?: unknown;
  error?: string;
  duration?: number;
  mode?: "transform" | "filter" | "aggregate" | "map" | "raw";
}

// Injected helpers available in all expressions
const HELPERS = `
  const pipe = (...fns) => x => fns.reduce((v, f) => f(v), x);

  const filter   = (arr, fn) => Array.isArray(arr) ? arr.filter(fn) : [];
  const map      = (arr, fn) => Array.isArray(arr) ? arr.map(fn) : [];
  const reduce   = (arr, fn, init) => Array.isArray(arr) ? arr.reduce(fn, init) : init;
  const find     = (arr, fn) => Array.isArray(arr) ? arr.find(fn) : undefined;
  const findAll  = (arr, fn) => Array.isArray(arr) ? arr.filter(fn) : [];

  const count    = (arr, fn) => Array.isArray(arr) ? (fn ? arr.filter(fn).length : arr.length) : 0;
  const sum      = (arr, key) => Array.isArray(arr) ? arr.reduce((s, i) => s + Number(typeof key === 'function' ? key(i) : (i[key] ?? 0)), 0) : 0;
  const avg      = (arr, key) => { const a = Array.isArray(arr) ? arr : []; return a.length ? sum(a, key) / a.length : 0; };
  const min      = (arr, key) => Array.isArray(arr) && arr.length ? arr.reduce((m, i) => { const v = typeof key === 'function' ? key(i) : i[key]; return v < m ? v : m; }, typeof key === 'function' ? key(arr[0]) : arr[0][key]) : null;
  const max      = (arr, key) => Array.isArray(arr) && arr.length ? arr.reduce((m, i) => { const v = typeof key === 'function' ? key(i) : i[key]; return v > m ? v : m; }, typeof key === 'function' ? key(arr[0]) : arr[0][key]) : null;

  const groupBy  = (arr, key) => Array.isArray(arr) ? arr.reduce((acc, i) => { const k = typeof key === 'function' ? key(i) : i[key]; (acc[k] = acc[k] || []).push(i); return acc; }, {}) : {};
  const countBy  = (arr, key) => { const g = groupBy(arr, key); return Object.fromEntries(Object.entries(g).map(([k, v]) => [k, v.length])); };
  const sumBy    = (arr, groupKey, sumKey) => { const g = groupBy(arr, groupKey); return Object.fromEntries(Object.entries(g).map(([k, v]) => [k, sum(v, sumKey)])); };

  const orderBy  = (arr, key, dir = 'asc') => Array.isArray(arr) ? [...arr].sort((a, b) => { const av = typeof key === 'function' ? key(a) : a[key]; const bv = typeof key === 'function' ? key(b) : b[key]; return dir === 'asc' ? (av > bv ? 1 : av < bv ? -1 : 0) : (av < bv ? 1 : av > bv ? -1 : 0); }) : [];
  const limit    = (arr, n, offset = 0) => Array.isArray(arr) ? arr.slice(offset, offset + n) : [];
  const skip     = (arr, n) => Array.isArray(arr) ? arr.slice(n) : [];

  const pick     = (obj, keys) => Object.fromEntries(keys.map(k => [k, obj[k]]));
  const omit     = (obj, keys) => Object.fromEntries(Object.entries(obj).filter(([k]) => !keys.includes(k)));
  const rename   = (obj, map) => { const r = {...obj}; Object.entries(map).forEach(([from, to]) => { r[to] = r[from]; delete r[from]; }); return r; };
  const addField = (obj, key, val) => ({ ...obj, [key]: typeof val === 'function' ? val(obj) : val });

  const pluck    = (arr, key) => Array.isArray(arr) ? arr.map(i => i[key]) : [];
  const uniq     = (arr, key) => { if (!Array.isArray(arr)) return []; if (!key) return [...new Set(arr)]; const seen = new Set(); return arr.filter(i => { const k = typeof key === 'function' ? key(i) : i[key]; if (seen.has(k)) return false; seen.add(k); return true; }); };
  const flatten  = (arr, depth = 1) => Array.isArray(arr) ? arr.flat(depth) : [];
  const chunk    = (arr, size) => { const r = []; for (let i = 0; i < arr.length; i += size) r.push(arr.slice(i, i + size)); return r; };

  const isNull   = v => v === null || v === undefined;
  const notNull  = v => v !== null && v !== undefined;
  const like     = (str, pattern) => { if (typeof str !== 'string') return false; const re = new RegExp('^' + pattern.replace(/%/g, '.*').replace(/_/g, '.') + '$', 'i'); return re.test(str); };
  const between  = (v, a, b) => v >= a && v <= b;
  const inList   = (v, arr) => arr.includes(v);

  const keys     = obj => obj ? Object.keys(obj) : [];
  const values   = obj => obj ? Object.values(obj) : [];
  const entries  = obj => obj ? Object.entries(obj) : [];
  const fromEntries = arr => Object.fromEntries(arr);

  const nullRows   = arr => Array.isArray(arr) ? arr.filter(i => i && typeof i === 'object' && Object.values(i).some(v => v === null || v === undefined)) : [];
  const hasField   = (arr, key) => Array.isArray(arr) ? arr.filter(i => key in i) : [];
  const missingField = (arr, key) => Array.isArray(arr) ? arr.filter(i => !(key in i) || i[key] === null || i[key] === undefined) : [];

  const stats = (arr, key) => {
    const vals = Array.isArray(arr) ? arr.map(i => typeof key === 'function' ? key(i) : i[key]).filter(v => typeof v === 'number') : [];
    if (!vals.length) return null;
    const s = vals.reduce((a, b) => a + b, 0);
    const sorted = [...vals].sort((a, b) => a - b);
    return { count: vals.length, sum: s, avg: s / vals.length, min: sorted[0], max: sorted[sorted.length - 1], median: sorted[Math.floor(sorted.length / 2)] };
  };

  const pivot = (arr, rowKey, colKey, valKey) => {
    const cols = [...new Set(arr.map(i => i[colKey]))];
    const rows = groupBy(arr, rowKey);
    return Object.entries(rows).map(([rk, items]) => {
      const row = { [rowKey]: rk };
      cols.forEach(c => { const found = items.find(i => i[colKey] === c); row[c] = found ? found[valKey] : null; });
      return row;
    });
  };
`;

function detectMode(code: string): "per-item" | "whole" {
  // "whole" mode triggers when `data` is used as the bare whole-array
  // identifier (e.g. `data.map(...)`, `sumBy(data, 'x')`). It must NOT trigger
  // when `data` is merely the name of a per-item field being accessed off `$`
  // (`$.data`, `$['data']`) — that's a property, not the array reference,
  // and building the function with a `data` parameter in that case leaves
  // `$` undefined for the rest of the expression.
  const bareData = /\bdata\b/g;
  let match: RegExpExecArray | null;
  while ((match = bareData.exec(code))) {
    const before = code.slice(0, match.index);
    if (/[.[]\s*['"]?$/.test(before)) continue; // preceded by `.` or `[` — property access, not the array itself
    return "whole";
  }
  return "per-item";
}

function detectResultMode(
  value: unknown,
  sampleResult: unknown,
): SandboxResult["mode"] {
  if (typeof sampleResult === "boolean") return "filter";
  if (Array.isArray(value)) {
    const first = (value as unknown[])[0];
    if (first !== null && typeof first === "object") return "transform";
    return "map";
  }
  if (value !== null && typeof value === "object") return "aggregate";
  return "raw";
}

export function runSandbox(code: string, data: unknown): SandboxResult {
  const t0 = performance.now();
  const trimmed = code.trim();
  if (!trimmed) return { type: "error", error: "Empty expression" };

  const mode = detectMode(trimmed);

  try {
    if (mode === "whole") {
      // eslint-disable-next-line no-new-func
      const fn = new Function(
        "data",
        `"use strict";\n${HELPERS}\nreturn (${trimmed});`,
      );
      const value = fn(data);
      const resultMode = Array.isArray(value)
        ? (value as unknown[])[0] !== null &&
          typeof (value as unknown[])[0] === "object"
          ? "transform"
          : "map"
        : value !== null && typeof value === "object"
          ? "aggregate"
          : "raw";
      return {
        type: "success",
        value,
        mode: resultMode,
        duration: Math.round(performance.now() - t0),
      };
    }

    // per-item mode — $ is each item
    // eslint-disable-next-line no-new-func
    const exprFn = new Function(
      "$",
      `"use strict";\n${HELPERS}\nreturn (${trimmed});`,
    );

    if (Array.isArray(data)) {
      const sample = data[0];
      let sampleResult: unknown;
      try {
        sampleResult = exprFn(sample);
      } catch {
        sampleResult = undefined;
      }

      if (typeof sampleResult === "boolean") {
        const value = data.filter((item) => {
          try {
            return Boolean(exprFn(item));
          } catch {
            return false;
          }
        });
        return {
          type: "success",
          value,
          mode: "filter",
          duration: Math.round(performance.now() - t0),
        };
      }

      const value = data.map((item) => {
        try {
          return exprFn(item);
        } catch {
          return item;
        }
      });
      const resultMode = detectResultMode(value, sampleResult);
      return {
        type: "success",
        value,
        mode: resultMode,
        duration: Math.round(performance.now() - t0),
      };
    }

    const value = exprFn(data);
    return {
      type: "success",
      value,
      mode: "raw",
      duration: Math.round(performance.now() - t0),
    };
  } catch (e) {
    return { type: "error", error: e instanceof Error ? e.message : String(e) };
  }
}
