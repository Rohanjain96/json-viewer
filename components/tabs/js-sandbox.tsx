"use client";
import { useRef, useState } from "react";
import { JSONValue } from "@/types/json";
import { runSandbox, SandboxResult } from "@/utils/js-sandbox";
import { CopyButton } from "@/components/copy-button";

interface Props { json: JSONValue; }

// ── Shortcut groups ──────────────────────────────────────────────────────────
const SHORTCUT_GROUPS = [
  {
    label: "Transform",
    items: [
      { label: "pick", snippet: `pick($, ['id', 'title'])` },
      { label: "omit", snippet: `omit($, ['body'])` },
      { label: "add field", snippet: `{ ...$, newKey: $.id * 2 }` },
      { label: "rename key", snippet: `{ ...$, newName: $.title, title: undefined }` },
      { label: "spread +", snippet: `{ ...$, titleUpper: $.title.toUpperCase() }` },
    ],
  },
  {
    label: "Filter",
    items: [
      { label: "equals", snippet: `$.userId === 1` },
      { label: "range", snippet: `between($.id, 10, 20)` },
      { label: "contains", snippet: `$.title.includes('dolor')` },
      { label: "like", snippet: `like($.title, '%dolor%')` },
      { label: "in list", snippet: `inList($.userId, [1, 2, 3])` },
      { label: "is null", snippet: `isNull($.field)` },
      { label: "not null", snippet: `notNull($.field)` },
    ],
  },
  {
    label: "Aggregate (data)",
    items: [
      { label: "count", snippet: `count(data)` },
      { label: "count if", snippet: `count(data, $ => $.userId === 1)` },
      { label: "sum", snippet: `sum(data, 'id')` },
      { label: "avg", snippet: `avg(data, 'id')` },
      { label: "min", snippet: `min(data, 'id')` },
      { label: "max", snippet: `max(data, 'id')` },
      { label: "stats", snippet: `stats(data, 'id')` },
    ],
  },
  {
    label: "Group / Sort",
    items: [
      { label: "groupBy", snippet: `groupBy(data, 'userId')` },
      { label: "countBy", snippet: `countBy(data, 'userId')` },
      { label: "sumBy", snippet: `sumBy(data, 'userId', 'id')` },
      { label: "orderBy ↑", snippet: `orderBy(data, 'id', 'asc')` },
      { label: "orderBy ↓", snippet: `orderBy(data, 'id', 'desc')` },
      { label: "limit", snippet: `limit(data, 10)` },
      { label: "skip", snippet: `skip(data, 5)` },
    ],
  },
  {
    label: "Array ops (data)",
    items: [
      { label: "pluck", snippet: `pluck(data, 'title')` },
      { label: "uniq", snippet: `uniq(data, 'userId')` },
      { label: "flatten", snippet: `flatten(data)` },
      { label: "chunk", snippet: `chunk(data, 10)` },
      { label: "null rows", snippet: `nullRows(data)` },
      { label: "missing", snippet: `missingField(data, 'title')` },
      { label: "pivot", snippet: `pivot(data, 'userId', 'id', 'title')` },
    ],
  },
];

// ── Mode pill config ─────────────────────────────────────────────────────────
const MODE_PILL: Record<string, { bg: string; color: string; label: string }> = {
  transform: { bg: "var(--accent-bg)", color: "var(--accent)", label: "TRANSFORM" },
  filter: { bg: "var(--success-bg)", color: "var(--success)", label: "FILTER" },
  map: { bg: "var(--surface)", color: "var(--text-dim)", label: "MAP" },
  aggregate: { bg: "var(--surface)", color: "var(--node-num)", label: "AGGREGATE" },
  raw: { bg: "var(--surface)", color: "var(--text-dim)", label: "VALUE" },
};

// ── Examples ─────────────────────────────────────────────────────────────────
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

export function JsSandboxTab({ json }: Props) {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<SandboxResult | null>(null);
  const [resultView, setResultView] = useState<"table" | "json">("table");
  const [activeGroup, setActiveGroup] = useState(0);
  const [showExamples, setShowExamples] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertSnippet = (snippet: string) => {
    setCode(snippet);
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(snippet.length, snippet.length);
    });
  };

  const run = () => {
    if (!code.trim()) return;
    setResult(runSandbox(code, json));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); run(); }
    if (e.key === "Tab") { e.preventDefault(); insertSnippet("  "); }
  };

  const rows = result?.type === "success" && Array.isArray(result.value)
    ? result.value as Record<string, unknown>[]
    : null;
  const headers = rows?.length && rows[0] !== null && typeof rows[0] === "object"
    ? Object.keys(rows[0] as object)
    : null;

  const pill = result?.mode ? MODE_PILL[result.mode] : null;
  const resultCount = Array.isArray(result?.value) ? (result!.value as unknown[]).length : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, height: "100%", minHeight: 0 }}>

      {/* Hint bar */}
      <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ color: "var(--text-faint)", fontSize: "0.79em", fontFamily: "monospace" }}>
          <span style={{ color: "var(--accent)" }}>$</span> = each item &nbsp;·&nbsp;
          <span style={{ color: "var(--node-num)" }}>data</span> = whole array &nbsp;·&nbsp;
          <span style={{ color: "var(--node-bool)" }}>boolean</span> → filter &nbsp;·&nbsp;
          <span style={{ color: "var(--node-str)" }}>object</span> → transform
        </span>
        <button onClick={() => setShowExamples(s => !s)}
          style={{ marginLeft: "auto", padding: "2px 10px", background: showExamples ? "var(--accent-bg)" : "var(--surface)", border: `1px solid ${showExamples ? "var(--accent)" : "var(--border)"}`, borderRadius: 4, color: showExamples ? "var(--accent)" : "var(--text-faint)", cursor: "pointer", fontSize: "0.79em", fontFamily: "monospace" }}>
          {showExamples ? "▾ Examples" : "▸ Examples"}
        </button>
      </div>

      {/* Examples drawer */}
      {showExamples && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, padding: "8px 10px", background: "var(--surface)", borderRadius: 6, border: "1px solid var(--border-faint)" }}>
          {EXAMPLES.map(ex => (
            <button key={ex.label} onClick={() => { setCode(ex.code); setShowExamples(false); requestAnimationFrame(() => textareaRef.current?.focus()); }}
              style={{ padding: "3px 10px", background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 4, color: "var(--text-dim)", cursor: "pointer", fontSize: "0.79em", fontFamily: "monospace" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-dim)"; }}>
              {ex.label}
            </button>
          ))}
        </div>
      )}

      {/* Shortcut groups */}
      <div style={{ display: "flex", flexDirection: "column", gap: 5, background: "var(--surface)", borderRadius: 6, border: "1px solid var(--border-faint)", padding: "6px 8px" }}>
        {/* Group tabs */}
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {SHORTCUT_GROUPS.map((g, i) => (
            <button key={g.label} onClick={() => setActiveGroup(i)}
              style={{ padding: "2px 9px", background: activeGroup === i ? "var(--accent-bg)" : "none", border: activeGroup === i ? "1px solid var(--accent)" : "1px solid transparent", borderRadius: 4, color: activeGroup === i ? "var(--accent)" : "var(--text-faint)", cursor: "pointer", fontSize: "0.72em", fontFamily: "monospace", fontWeight: activeGroup === i ? 600 : 400 }}>
              {g.label}
            </button>
          ))}
        </div>
        {/* Shortcut chips */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {SHORTCUT_GROUPS[activeGroup].items.map(s => (
            <button key={s.label} onClick={() => insertSnippet(s.snippet)}
              style={{ padding: "3px 10px", background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 4, color: "var(--text-dim)", cursor: "pointer", fontSize: "0.79em", fontFamily: "monospace" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-dim)"; }}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", top: 11, left: 12, color: "var(--accent)", fontSize: "0.86em", fontFamily: "monospace", pointerEvents: "none", userSelect: "none", zIndex: 1 }}>
          {/\bdata\b/.test(code) ? "data" : "$"} →
        </span>
        <textarea
          ref={textareaRef}
          value={code}
          onChange={e => setCode(e.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          placeholder={`// per-item transform:\n{ ...$, titleLen: $.title.length }\n\n// filter:\n$.userId === 1 && $.id > 5\n\n// whole-array aggregate:\ncountBy(data, 'userId')`}
          style={{
            width: "100%", minHeight: 110,
            background: "var(--input-bg)", border: "1px solid var(--border)",
            borderRadius: 8, padding: "10px 14px 10px 64px",
            color: "var(--input-color)", fontFamily: "monospace",
            fontSize: "0.93em", lineHeight: 1.7, resize: "vertical",
            outline: "none", boxSizing: "border-box",
          }}
        />
      </div>

      {/* Run bar */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button onClick={run}
          style={{ padding: "7px 20px", background: "var(--accent)", border: "none", borderRadius: 6, color: "#fff", cursor: "pointer", fontSize: "0.93em", fontWeight: 600 }}>
          Run ▶
        </button>
        <span style={{ color: "var(--text-faint)", fontSize: "0.72em", fontFamily: "monospace" }}>Ctrl+Enter</span>
        {pill && (
          <span style={{ padding: "2px 10px", borderRadius: 20, background: pill.bg, color: pill.color, fontSize: "0.72em", fontFamily: "monospace", fontWeight: 700 }}>
            {pill.label}
          </span>
        )}
        {result?.type === "success" && (
          <span style={{ marginLeft: "auto", color: "var(--text-faint)", fontSize: "0.72em", fontFamily: "monospace" }}>
            {resultCount !== null ? `${resultCount} rows · ` : ""}{result.duration}ms
          </span>
        )}
      </div>

      {/* Result panel */}
      {result && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", border: "1px solid var(--border-faint)", borderRadius: 8, overflow: "hidden", minHeight: 0 }}>
          <div style={{ padding: "6px 12px", background: "var(--panel)", borderBottom: "1px solid var(--border-faint)", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <span style={{ color: "var(--text-dim)", fontSize: "0.72em", letterSpacing: 1.5, fontWeight: 600 }}>
              {result.type === "error" ? "ERROR" : "OUTPUT"}
            </span>
            {result.type === "success" && headers && (
              <div style={{ display: "flex", gap: 3 }}>
                {(["table", "json"] as const).map(v => (
                  <button key={v} onClick={() => setResultView(v)}
                    style={{ padding: "2px 8px", background: resultView === v ? "var(--accent-bg)" : "none", border: resultView === v ? "1px solid var(--accent)" : "1px solid transparent", borderRadius: 4, color: resultView === v ? "var(--text)" : "var(--text-faint)", cursor: "pointer", fontSize: "0.72em" }}>
                    {v}
                  </button>
                ))}
              </div>
            )}
            {result.type === "success" && (
              <div style={{ marginLeft: "auto" }}>
                <CopyButton text={JSON.stringify(result.value, null, 2)} label="Copy" size="xs" />
              </div>
            )}
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
            {result.type === "error" ? (
              <div style={{ color: "var(--btn-danger)", fontFamily: "monospace", fontSize: "0.86em", background: "var(--danger)", border: "1px solid var(--danger-border)", borderRadius: 6, padding: "10px 14px" }}>
                ⚠ {result.error}
              </div>
            ) : resultView === "table" && rows && headers ? (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "monospace", fontSize: "0.86em" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      <th style={{ padding: "5px 10px", color: "var(--text-faint)", textAlign: "left", fontSize: "0.72em", letterSpacing: 1, fontWeight: 600 }}>#</th>
                      {headers.map(h => (
                        <th key={h} style={{ padding: "5px 10px", color: "var(--text-dim)", textAlign: "left", fontSize: "0.72em", letterSpacing: 1, fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid var(--border-faint)" }}
                        onMouseEnter={e => e.currentTarget.style.background = "var(--surface)"}
                        onMouseLeave={e => e.currentTarget.style.background = "none"}>
                        <td style={{ padding: "5px 10px", color: "var(--text-faint)", verticalAlign: "top" }}>{i + 1}</td>
                        {headers.map(h => {
                          const v = (row as Record<string, unknown>)[h];
                          const color = v === null || v === undefined ? "var(--node-null)"
                            : typeof v === "number" ? "var(--node-num)"
                              : typeof v === "boolean" ? "var(--node-bool)"
                                : typeof v === "string" ? "var(--node-str)"
                                  : "var(--text)";
                          return (
                            <td key={h} style={{ padding: "5px 10px", color, verticalAlign: "top", maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {v === null ? "null" : v === undefined ? "—" : typeof v === "object" ? JSON.stringify(v) : String(v)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <pre style={{ color: "var(--text)", fontFamily: "monospace", fontSize: "0.86em", lineHeight: 1.7, whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0 }}>
                {JSON.stringify(result.value, null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}