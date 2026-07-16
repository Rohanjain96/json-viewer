"use client";
import { useRef, useState, useMemo, useEffect } from "react";
import { JSONValue } from "@/types/json";
import { SandboxResult } from "@/utils/js-sandbox";
import { runSandboxAsync } from "@/utils/sandbox-async";
import { CopyButton } from "@/components/copy-button";
import { SandboxPalette } from "@/components/tabs/sandbox-palette";
import { useBreakpoint } from "@/hooks/use-breakpoints";

interface Props { json: JSONValue; }

const MODE_PILL: Record<string, { bg: string; color: string; label: string }> = {
  transform: { bg: "var(--accent-bg)", color: "var(--accent)", label: "TRANSFORM" },
  filter: { bg: "var(--success-bg)", color: "var(--success)", label: "FILTER" },
  map: { bg: "var(--surface)", color: "var(--text-dim)", label: "MAP" },
  aggregate: { bg: "var(--surface)", color: "var(--node-num)", label: "AGGREGATE" },
  raw: { bg: "var(--surface)", color: "var(--text-dim)", label: "VALUE" },
};

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
    <div className="card" id="sandbox-field-listbox" role="listbox" style={{ position: "absolute", bottom: "100%", left: 12, marginBottom: 4, minWidth: 200, maxWidth: 320, zIndex: 50, boxShadow: "var(--shadow-md)", borderRadius: "var(--radius-md)", overflow: "hidden", animation: "fadeSlideUp 0.1s var(--ease-out)" }}>
      {suggestions.slice(0, 8).map((s, i) => (
        <div key={s} id={`sandbox-field-option-${i}`} role="option" aria-selected={i === index}
          onMouseDown={() => onPick(s)}
          style={{ padding: "6px 11px", cursor: "pointer", background: i === index ? "var(--accent-bg)" : "transparent", fontSize: "0.85em", color: i === index ? "var(--text)" : "var(--text-dim)" }}
          className="mono">
          {s}
        </div>
      ))}
    </div>
  );
}

export function JsSandboxTab({ json }: Props) {
  const { isMobile } = useBreakpoint();
  const [code, setCode] = useState("");
  const [result, setResult] = useState<SandboxResult | null>(null);
  const [resultView, setResultView] = useState<"table" | "json">("table");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [running, setRunning] = useState(false);
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

  const run = async () => {
    if (!code.trim() || running) return;
    setAcOpen(false);
    setRunning(true);
    const res = await runSandboxAsync(code, json);
    setResult(res);
    setRunning(false);
  };

  // Ctrl/Cmd+K opens the snippet palette. Scoped to this component's own
  // lifecycle — the tab unmounts when inactive, so this never fires elsewhere.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

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
        <button onClick={() => setPaletteOpen(true)}
          style={{ marginLeft: "auto", padding: "4px 12px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", color: "var(--text-faint)", cursor: "pointer", fontSize: "0.8em", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 6 }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--border-strong)"; e.currentTarget.style.color = "var(--text)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-faint)"; }}>
          Snippets &amp; Examples
          <span className="mono" style={{ fontSize: "0.9em", color: "var(--text-faint)", background: "var(--panel)", border: "1px solid var(--border-faint)", borderRadius: "var(--radius-sm)", padding: "0 5px" }}>⌘K</span>
        </button>
      </div>

      <SandboxPalette
        open={paletteOpen}
        isMobile={isMobile}
        onClose={() => setPaletteOpen(false)}
        onSelect={insertSnippet}
      />

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
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={acOpen && currentSuggestions.length > 0}
          aria-controls="sandbox-field-listbox"
          aria-activedescendant={acOpen && currentSuggestions.length > 0 ? `sandbox-field-option-${acIndex}` : undefined}
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
        <button onClick={run} disabled={running}
          style={{ padding: "8px 22px", background: running ? "var(--surface)" : "var(--accent-strong)", border: running ? "1px solid var(--border)" : "none", borderRadius: "var(--radius-md)", color: running ? "var(--text-faint)" : "#fff", cursor: running ? "wait" : "pointer", fontSize: "0.9em", fontWeight: 600, boxShadow: running ? "none" : "var(--shadow-button)", display: "inline-flex", alignItems: "center", gap: 8 }}
          onMouseEnter={e => { if (!running) e.currentTarget.style.background = "var(--accent)"; }}
          onMouseLeave={e => { if (!running) e.currentTarget.style.background = "var(--accent-strong)"; }}>
          {running ? (
            <>
              <span style={{ width: 12, height: 12, border: "2px solid var(--border-strong)", borderTop: "2px solid var(--text-dim)", borderRadius: "50%", animation: "spin 0.6s linear infinite", flexShrink: 0 }} />
              Running…
            </>
          ) : "Run ▶"}
        </button>
        <span style={{ color: "var(--text-faint)", fontSize: "0.74em" }} className="mono">Ctrl+Enter · runs in your browser, stopped after 4s if it hangs</span>
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