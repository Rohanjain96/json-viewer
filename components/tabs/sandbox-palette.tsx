"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { SANDBOX_SNIPPETS, SandboxSnippet, SandboxSnippetCategory } from "@/data/sandbox-snippets";

const CATEGORY_COLOR: Record<SandboxSnippetCategory, string> = {
  "Transform": "var(--accent)",
  "Filter": "var(--success)",
  "Aggregate (data)": "var(--node-num)",
  "Group / Sort": "var(--node-bool)",
  "Array ops (data)": "var(--node-key)",
  "Example": "var(--node-str)",
};

interface Props {
  open: boolean;
  isMobile: boolean;
  onClose: () => void;
  onSelect: (code: string) => void;
}

function matches(query: string, s: SandboxSnippet): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  return (
    s.label.toLowerCase().includes(q) ||
    s.code.toLowerCase().includes(q) ||
    s.category.toLowerCase().includes(q)
  );
}

export function SandboxPalette({ open, isMobile, onClose, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [rawIndex, setRawIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => SANDBOX_SNIPPETS.filter(s => matches(query, s)), [query]);
  // Clamp at read time instead of resetting via effect whenever the result
  // set shrinks — avoids a setState-in-effect render cascade on every keystroke.
  const index = results.length ? Math.min(rawIndex, results.length - 1) : 0;

  // Reset search state as a render-time adjustment on the open transition
  // (not an effect) — see https://react.dev/learn/you-might-not-need-an-effect.
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) { setQuery(""); setRawIndex(0); }
  }

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  if (!open) return null;

  const pick = (s: SandboxSnippet) => {
    onSelect(s.code);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setRawIndex(Math.min(index + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setRawIndex(Math.max(index - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); if (results[index]) pick(results[index]); }
    else if (e.key === "Escape") { e.preventDefault(); onClose(); }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 400, background: "var(--overlay)",
        display: "flex", justifyContent: "center",
        alignItems: isMobile ? "stretch" : "flex-start",
        paddingTop: isMobile ? 0 : "12vh",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="card"
        role="dialog"
        aria-label="Search snippets and examples"
        style={{
          width: isMobile ? "100%" : "min(560px, 92vw)",
          height: isMobile ? "100%" : "fit-content",
          maxHeight: isMobile ? "100%" : "70vh",
          borderRadius: isMobile ? 0 : "var(--radius-lg)",
          display: "flex", flexDirection: "column", overflow: "hidden",
          boxShadow: "var(--shadow-md)",
          animation: "fadeSlideUp 0.15s var(--ease-out)",
        }}
      >
        <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border-faint)", flexShrink: 0 }}>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search snippets & examples…"
            className="mono"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={results.length > 0}
            aria-controls="sandbox-palette-listbox"
            aria-activedescendant={results[index] ? `sandbox-palette-option-${index}` : undefined}
            style={{ width: "100%", background: "none", border: "none", outline: "none", color: "var(--text)", fontSize: "0.95em" }}
          />
        </div>

        <div id="sandbox-palette-listbox" role="listbox" style={{ overflowY: "auto", flex: 1 }}>
          {results.length === 0 ? (
            <div style={{ padding: "28px 14px", textAlign: "center", color: "var(--text-dim)", fontSize: "0.86em" }}>
              No matching snippet — try a different word
            </div>
          ) : results.map((s, i) => (
            <div
              key={`${s.category}-${s.label}`}
              id={`sandbox-palette-option-${i}`}
              role="option"
              aria-selected={i === index}
              onMouseDown={() => pick(s)}
              onMouseEnter={() => setRawIndex(i)}
              style={{
                padding: "8px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
                background: i === index ? "var(--accent-bg)" : "transparent",
              }}
            >
              <span style={{
                fontSize: "0.64em", fontWeight: 700, letterSpacing: 0.3, flexShrink: 0, whiteSpace: "nowrap",
                color: CATEGORY_COLOR[s.category], background: "var(--surface)",
                border: "1px solid var(--border-faint)", borderRadius: 999, padding: "1px 7px",
              }}>
                {s.category}
              </span>
              <span style={{ fontSize: "0.85em", color: "var(--text)", fontWeight: 600, flexShrink: 0 }}>{s.label}</span>
              <span className="mono" style={{ fontSize: "0.78em", color: "var(--text-faint)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                {s.code}
              </span>
            </div>
          ))}
        </div>

        <div style={{ padding: "6px 14px", fontSize: "0.68em", color: "var(--text-faint)", borderTop: "1px solid var(--border-faint)", flexShrink: 0 }}>
          ↑↓ navigate · ↵ insert · Esc close
        </div>
      </div>
    </div>
  );
}
