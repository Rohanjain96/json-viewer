"use client";
import { useRef, useState, useMemo, useCallback } from "react";
import { JSONValue } from "@/types/json";
import { runSandbox, SandboxResult } from "@/utils/js-sandbox";
import { CopyButton } from "@/components/copy-button";

interface Props { json: JSONValue; }

const SHORTCUT_GROUPS = [
  {
    label: "Transform", items: [
      { label: "pick", snippet: `pick($, ['id', 'title'])` },
      { label: "omit", snippet: `omit($, ['body'])` },
      { label: "add field", snippet: `{ ...$, newKey: $.id * 2 }` },
      { label: "rename key", snippet: `{ ...$, newName: $.title, title: undefined }` },
      { label: "spread +", snippet: `{ ...$, titleUpper: $.title.toUpperCase() }` },
    ]
  },
  {
    label: "Filter", items: [
      { label: "equals", snippet: `$.userId === 1` },
      { label: "range", snippet: `between($.id, 10, 20)` },
      { label: "contains", snippet: `$.title.includes('dolor')` },
      { label: "like", snippet: `like($.title, '%dolor%')` },
      { label: "in list", snippet: `inList($.userId, [1, 2, 3])` },
      { label: "is null", snippet: `isNull($.field)` },
      { label: "not null", snippet: `notNull($.field)` },
    ]
  },
  {
    label: "Aggregate (data)", items: [
      { label: "count", snippet: `count(data)` },
      { label: "count if", snippet: `count(data, $ => $.userId === 1)` },
      { label: "sum", snippet: `sum(data, 'id')` },
      { label: "avg", snippet: `avg(data, 'id')` },
      { label: "min", snippet: `min(data, 'id')` },
      { label: "max", snippet: `max(data, 'id')` },
      { label: "stats", snippet: `stats(data, 'id')` },
    ]
  },
  {
    label: "Group / Sort", items: [
      { label: "groupBy", snippet: `groupBy(data, 'userId')` },
      { label: "countBy", snippet: `countBy(data, 'userId')` },
      { label: "sumBy", snippet: `sumBy(data, 'userId', 'id')` },
      { label: "orderBy ↑", snippet: `orderBy(data, 'id', 'asc')` },
      { label: "orderBy ↓", snippet: `orderBy(data, 'id', 'desc')` },
      { label: "limit", snippet: `limit(data, 10)` },
      { label: "skip", snippet: `skip(data, 5)` },
    ]
  },
  {
    label: "Array ops (data)", items: [
      { label: "pluck", snippet: `pluck(data, 'title')` },
      { label: "uniq", snippet: `uniq(data, 'userId')` },
      { label: "flatten", snippet: `flatten(data)` },
      { label: "chunk", snippet: `chunk(data, 10)` },
      { label: "null rows", snippet: `nullRows(data)` },
      { label: "missing", snippet: `missingField(data, 'title')` },
      { label: "pivot", snippet: `pivot(data, 'userId', 'id', 'title')` },
    ]
  },
];

const MODE_PILL: Record<string, { bg: string; color: string; label: string }> = {
  transform: { bg: "var(--accent-bg)", color: "var(--accent)", label: "TRANSFORM" },
  filter: { bg: "var(--success-bg)", color: "var(--success)", label: "FILTER" },
  map: { bg: "var(--surface)", color: "var(--text-dim)", label: "MAP" },
  aggregate: { bg: "var(--surface)", color: "var(--node-num)", label: "AGGREGATE" },
  raw: { bg: "var(--surface)", color: "var(--text-dim)", label: "VALUE" },
};

const EXAMPLES = [
  { label: "Posts by user 1", code: `$.userId === 1` },
  { label: "Pick id + title", code: `pick($, ['id', 'title'])` },
  { label: "Add title length", code: `{ ...$, titleLen: $.title.length }` },
  { label: "Count per user", code: `countBy(data, 'userId')` },
  { label: "Top 5 by id desc", code: `limit(orderBy(data, 'id', 'desc'), 5)` },
  { label: "Stats on id", code: `stats(data, 'id')` },
  { label: "Titles containing dolor", code: `like($.title, '%dolor%')` },
  { label: "All unique userIds", code: `uniq(pluck(data, 'userId'))` },
];

// ── Field extraction for autocomplete ───────────────────────────────────────
function extractFieldPaths(sample: unknown, prefix = "", depth = 0): string[] {
  if (!sample || typeof sample !== "object" || depth > 3) return [];
  const out: string[] = [];
  for (const [k, v] of Object.entries(sample as Record<string, unknown>)) {
    const p = prefix ? `${prefix}.${k}` : k;
    out.push(p);
    if (v && typeof v === "object" && !Array.isArray(v)) out.push(...extractFieldPaths(v, p, depth + 1));
  }
  return out;
}

const BUILTIN_FNS = [
  "pick", "omit", "count", "sum", "avg", "min", "max", "stats", "groupBy", "countBy",
  "sumBy", "orderBy", "limit", "skip", "pluck", "uniq", "flatten", "chunk", "nullRows",
  "missingField", "pivot", "between", "like", "inList", "isNull", "notNull",
];

// ── Autocomplete dropdown ───────────────────────────────────────────────────
function EditorAutocomplete({ suggestions, index, onPick }: { suggestions: string[]; index: number; onPick: (s: string) => void; }) {
  if (!suggestions.length) return null;
  return (
    <div className="card" style={{ position: "absolute", bottom: "100%", left: 12, marginBottom: 4, minWidth: 200, maxWidth: 320, zIndex: 50, boxShadow: "var(--shadow-md)", borderRadius: "var(--radius-md)", overflow: "hidden", animation: "fadeSlideUp 0.1s var(--ease-out)" }}>
      {suggestions.slice(0, 8).map((s, i) => (
        <div key={s} onMouseDown={() => onPick(s)}
          style={{ padding: "6px 11px", cursor: "pointer", background: i === index ? "var(--accent-bg)" : "transparent", borderLeft: `2px solid ${i === index ? "var(--accent)" : "transparent"}`, fontSize: "0.85em", color: i === index ? "var(--text)" : "var(--text-dim)" }}
          className="mono">
          {s}
        </div>
      ))}
    </div>
  );
}

export function JsSandboxTab({ json }: Props) {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<SandboxResult | null>(null);
  const [resultView, setResultView] = useState<"table" | "json">("table");
  const [activeGroup, setActiveGroup] = useState(0);
  const [showExamples, setShowExamples] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ac state
  const [acOpen, setAcOpen] = useState(false);
  const [acIndex, setAcIndex] = useState(0);
  const [acToken, setAcToken] = useState("");
  const [acStart, setAcStart] = useState(0);

  const sampleItem = Array.isArray(json) ? (json as unknown[])[0] : json;
  const fieldPaths = useMemo(() => extractFieldPaths(sampleItem), [sampleItem]);
  const allSuggestions = useMemo(() => [...fieldPaths, ...BUILTIN_FNS], [fieldPaths]);

  const insertSnippet = (snippet: string) => {
    setCode(snippet);
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(snippet.length, snippet.length);
    });
  };

  // Detect the current "word" being typed (after $., data., or a bare identifier)
  const evaluateAutocomplete = (value: string, caret: number) => {
    const upToCaret = value.slice(0, caret);
    const match = upToCaret.match(/(\$|data)\.([a-zA-Z0-9_.]*)$/);
    if (match) {
      const token = match[2];
      const start = caret - token.length;
      const filtered = fieldPaths.filter(f => f.toLowerCase().startsWith(token.toLowerCase()) && f !== token);
      if (filtered.length) { setAcOpen(true); setAcToken(token); setAcStart(start); setAcIndex(0); return; }
    }
    const bareMatch = upToCaret.match(/[a-zA-Z_][a-zA-Z0-9_]*$/);
    if (bareMatch && bareMatch[0].length >= 2) {
      const token = bareMatch[0];
      const start = caret - token.length;
      const filtered = BUILTIN_FNS.filter(f => f.startsWith(token) && f !== token);
      if (filtered.length) { setAcOpen(true); setAcToken(token); setAcStart(start); setAcIndex(0); return; }
    }
    setAcOpen(false);
  };

  const currentSuggestions = useMemo(() => {
    if (!acOpen) return [];
    const inPath = /^[a-zA-Z0-9_.]*$/.test(acToken) && fieldPaths.some(f => f.toLowerCase().startsWith(acToken.toLowerCase()));
    const pool = inPath ? fieldPaths : allSuggestions;
    return pool.filter(f => f.toLowerCase().startsWith(acToken.toLowerCase()) && f !== acToken);
  }, [acOpen, acToken, fieldPaths, allSuggestions]);

  const pickSuggestion = (s: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const before = code.slice(0, acStart);
    const after = code.slice(acStart + acToken.length);
    const next = before + s + after;
    setCode(next);
    setAcOpen(false);
    requestAnimationFrame(() => {
      const caret = before.length + s.length;
      el.focus();
      el.setSelectionRange(caret, caret);
    });
  };

  const run = () => {
    if (!code.trim()) return;
    setAcOpen(false);
    setResult(runSandbox(code, json));
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const el = e.target;
    setCode(el.value);
    evaluateAutocomplete(el.value, el.selectionStart ?? el.value.length);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (acOpen && currentSuggestions.length) {
      if (e.key === "ArrowDown") { e.preventDefault(); setAcIndex(i => Math.min(i + 1, currentSuggestions.length - 1)); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); setAcIndex(i => Math.max(i - 1, 0)); return; }
      if (e.key === "Tab" || e.key === "Enter") { e.preventDefault(); pickSuggestion(currentSuggestions[acIndex]); return; }
      if (e.key === "Escape") { setAcOpen(false); return; }
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); run(); }
    if (e.key === "Tab") { e.preventDefault(); insertSnippet(code + "  "); }
  };

  const rows = result?.type === "success" && Array.isArray(result.value) ? result.value as Record<string, unknown>[] : null;
  const headers = rows?.length && rows[0] !== null && typeof rows[0] === "object" ? Object.keys(rows[0] as object) : null;
  const pill = result?.mode ? MODE_PILL[result.mode] : null;
  const resultCount = Array.isArray(result?.value) ? (result!.value as unknown[]).length : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%", minHeight: 0 }}>

      <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ color: "var(--text-faint)", fontSize: "0.82em" }} className="mono">
          <span style={{ color: "var(--accent)" }}>$</span> = each item &nbsp;·&nbsp;
          <span style={{ color: "var(--node-num)" }}>data</span> = whole array &nbsp;·&nbsp;
          <span style={{ color: "var(--node-bool)" }}>boolean</span> → filter &nbsp;·&nbsp;
          <span style={{ color: "var(--node-str)" }}>object</span> → transform
        </span>
        <button onClick={() => setShowExamples(s => !s)}
          style={{ marginLeft: "auto", padding: "4px 12px", background: showExamples ? "var(--accent-bg)" : "var(--surface)", border: `1px solid ${showExamples ? "var(--accent-border)" : "var(--border)"}`, borderRadius: "var(--radius-md)", color: showExamples ? "var(--accent)" : "var(--text-faint)", cursor: "pointer", fontSize: "0.8em", fontWeight: 500 }}>
          {showExamples ? "▾ Examples" : "▸ Examples"}
        </button>
      </div>

      {showExamples && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "10px 12px", background: "var(--surface)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-faint)" }}>
          {EXAMPLES.map(ex => (
            <button key={ex.label} onClick={() => { setCode(ex.code); setShowExamples(false); requestAnimationFrame(() => textareaRef.current?.focus()); }}
              style={{ padding: "4px 11px", background: "var(--panel)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", color: "var(--text-dim)", cursor: "pointer", fontSize: "0.8em" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-dim)"; }}>
              {ex.label}
            </button>
          ))}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 6, background: "var(--surface)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-faint)", padding: "8px 9px" }}>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {SHORTCUT_GROUPS.map((g, i) => (
            <button key={g.label} onClick={() => setActiveGroup(i)}
              style={{ padding: "3px 10px", background: activeGroup === i ? "var(--accent-bg)" : "none", border: activeGroup === i ? "1px solid var(--accent-border)" : "1px solid transparent", borderRadius: "var(--radius-sm)", color: activeGroup === i ? "var(--accent)" : "var(--text-faint)", cursor: "pointer", fontSize: "0.76em", fontWeight: activeGroup === i ? 600 : 500 }}>
              {g.label}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {SHORTCUT_GROUPS[activeGroup].items.map(s => (
            <button key={s.label} onClick={() => insertSnippet(s.snippet)}
              style={{ padding: "4px 10px", background: "var(--panel)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", color: "var(--text-dim)", cursor: "pointer", fontSize: "0.8em" }}
              className="mono"
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-dim)"; }}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ position: "relative" }}>
        <span className="mono" style={{ position: "absolute", top: 12, left: 13, color: "var(--accent)", fontSize: "0.86em", pointerEvents: "none", userSelect: "none", zIndex: 1, fontWeight: 600 }}>
          {/\bdata\b/.test(code) ? "data" : "$"} →
        </span>
        <EditorAutocomplete suggestions={currentSuggestions} index={acIndex} onPick={pickSuggestion} />
        <textarea
          ref={textareaRef}
          value={code}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={() => setTimeout(() => setAcOpen(false), 120)}
          spellCheck={false}
          placeholder={`// per-item transform:\n{ ...$, titleLen: $.title.length }\n\n// filter:\n$.userId === 1 && $.id > 5\n\n// whole-array aggregate:\ncountBy(data, 'userId')`}
          className="mono"
          style={{
            width: "100%", minHeight: 110,
            background: "var(--input-bg)", border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)", padding: "11px 15px 11px 64px",
            color: "var(--input-color)", fontSize: "0.92em", lineHeight: 1.7,
            resize: "vertical", outline: "none", boxSizing: "border-box",
            transition: "border-color 0.15s var(--ease-out)",
          }}
          onFocus={e => e.currentTarget.style.borderColor = "var(--accent)"}
        />
      </div>
      <div style={{ marginTop: -8, fontSize: "0.72em", color: "var(--text-faint)" }}>
        Type <span className="mono">$.</span> or <span className="mono">data.</span> for field suggestions
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <button onClick={run}
          style={{ padding: "8px 22px", background: "var(--accent-strong)", border: "none", borderRadius: "var(--radius-md)", color: "#fff", cursor: "pointer", fontSize: "0.9em", fontWeight: 600, boxShadow: "0 1px 2px rgba(0,0,0,0.2)" }}
          onMouseEnter={e => e.currentTarget.style.background = "var(--accent)"}
          onMouseLeave={e => e.currentTarget.style.background = "var(--accent-strong)"}>
          Run ▶
        </button>
        <span style={{ color: "var(--text-faint)", fontSize: "0.74em" }} className="mono">Ctrl+Enter</span>
        {pill && (
          <span style={{ padding: "3px 11px", borderRadius: "var(--radius-full)", background: pill.bg, color: pill.color, fontSize: "0.72em", fontWeight: 700 }} className="mono">
            {pill.label}
          </span>
        )}
        {result?.type === "success" && (
          <span style={{ marginLeft: "auto", color: "var(--text-faint)", fontSize: "0.74em" }} className="mono">
            {resultCount !== null ? `${resultCount} rows · ` : ""}{result.duration}ms
          </span>
        )}
      </div>

      {result && (
        <div className="card" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>
          <div style={{ padding: "7px 13px", background: "var(--surface)", borderBottom: "1px solid var(--border-faint)", display: "flex", alignItems: "center", gap: 9, flexShrink: 0 }}>
            <span style={{ color: "var(--text)", fontSize: "0.75em", letterSpacing: 0.5, fontWeight: 600, textTransform: "uppercase" }}>
              {result.type === "error" ? "Error" : "Output"}
            </span>
            {result.type === "success" && headers && (
              <div style={{ display: "flex", gap: 2, background: "var(--panel)", padding: 2, borderRadius: "var(--radius-sm)" }}>
                {(["table", "json"] as const).map(v => (
                  <button key={v} onClick={() => setResultView(v)}
                    style={{ padding: "3px 10px", background: resultView === v ? "var(--surface)" : "none", border: "none", borderRadius: 4, color: resultView === v ? "var(--text)" : "var(--text-faint)", cursor: "pointer", fontSize: "0.74em", fontWeight: 500, textTransform: "capitalize" }}>
                    {v}
                  </button>
                ))}
              </div>
            )}
            {result.type === "success" && (
              <div style={{ marginLeft: "auto" }}><CopyButton text={JSON.stringify(result.value, null, 2)} label="Copy" size="xs" /></div>
            )}
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: 13 }}>
            {result.type === "error" ? (
              <div className="mono" style={{ color: "var(--btn-danger)", fontSize: "0.86em", background: "var(--danger)", border: "1px solid var(--danger-border)", borderRadius: "var(--radius-md)", padding: "11px 14px" }}>
                ⚠ {result.error}
              </div>
            ) : resultView === "table" && rows && headers ? (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.86em" }} className="mono">
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      <th style={{ padding: "6px 10px", color: "var(--text-faint)", textAlign: "left", fontSize: "0.72em", letterSpacing: 0.5, fontWeight: 600 }}>#</th>
                      {headers.map(h => (<th key={h} style={{ padding: "6px 10px", color: "var(--text-dim)", textAlign: "left", fontSize: "0.72em", letterSpacing: 0.5, fontWeight: 600 }}>{h}</th>))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid var(--border-faint)", transition: "background 0.1s var(--ease-out)" }}
                        onMouseEnter={e => e.currentTarget.style.background = "var(--surface)"}
                        onMouseLeave={e => e.currentTarget.style.background = "none"}>
                        <td style={{ padding: "6px 10px", color: "var(--text-faint)", verticalAlign: "top" }}>{i + 1}</td>
                        {headers.map(h => {
                          const v = (row as Record<string, unknown>)[h];
                          const color = v === null || v === undefined ? "var(--node-null)" : typeof v === "number" ? "var(--node-num)" : typeof v === "boolean" ? "var(--node-bool)" : typeof v === "string" ? "var(--node-str)" : "var(--text)";
                          return (<td key={h} style={{ padding: "6px 10px", color, verticalAlign: "top", maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v === null ? "null" : v === undefined ? "—" : typeof v === "object" ? JSON.stringify(v) : String(v)}</td>);
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <pre className="mono" style={{ color: "var(--text)", fontSize: "0.86em", lineHeight: 1.7, whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0 }}>
                {JSON.stringify(result.value, null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}