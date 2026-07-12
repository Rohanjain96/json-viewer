"use client";
import { useRef } from "react";

interface Props {
    query: string; setQuery: (q: string) => void; onRun: () => void; onClear: () => void;
    suggestions: string[]; acActive: boolean; acIndex: number;
    setAcActive: (v: boolean) => void; setAcIndex: (fn: ((i: number) => number) | number) => void;
    isMobile: boolean; pad: number;
}

export function QueryBar({ query, setQuery, onRun, onClear, suggestions, acActive, acIndex, setAcActive, setAcIndex, isMobile, pad }: Props) {
    const inputRef = useRef<HTMLInputElement>(null);

    const pickSuggestion = (s: string) => {
        setQuery(s); setAcActive(false); setAcIndex(-1); inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!acActive || suggestions.length === 0) { if (e.key === "Enter") onRun(); return; }
        if (e.key === "ArrowDown") { e.preventDefault(); setAcIndex((i: number) => Math.min(i + 1, suggestions.length - 1)); }
        else if (e.key === "ArrowUp") { e.preventDefault(); setAcIndex((i: number) => Math.max(i - 1, -1)); }
        else if (e.key === "Tab") { e.preventDefault(); pickSuggestion(acIndex >= 0 ? suggestions[acIndex] : suggestions[0]); }
        else if (e.key === "Enter") {
            if (acIndex >= 0) { e.preventDefault(); pickSuggestion(suggestions[acIndex]); }
            else { setAcActive(false); onRun(); }
        } else if (e.key === "Escape") { setAcActive(false); setAcIndex(-1); }
    };

    const showDropdown = acActive && suggestions.length > 0;

    return (
        <div style={{ background: "var(--panel)", borderBottom: "1px solid var(--border-faint)", padding: `${isMobile ? 8 : 12}px ${pad}px`, display: "flex", flexDirection: isMobile ? "column" : "row", gap: 8, flexShrink: 0 }}>
            <div style={{ display: "flex", gap: 8, flex: 1, alignItems: "center" }}>
                <div style={{ flex: 1, position: "relative" }}>
                    <div style={{ display: "flex", alignItems: "center" }}>
                        <span className="mono" style={{ position: "absolute", left: 12, color: "var(--accent)", fontSize: "0.9em", pointerEvents: "none", fontWeight: 600 }}>$</span>
                        <input
                            ref={inputRef}
                            value={query}
                            onChange={e => { setQuery(e.target.value); setAcActive(true); setAcIndex(-1); }}
                            onFocus={() => setAcActive(true)}
                            onBlur={() => setTimeout(() => setAcActive(false), 150)}
                            onKeyDown={handleKeyDown}
                            placeholder="Enter JSONPath e.g. $.store.orders[*].status"
                            className="mono"
                            style={{
                                width: "100%", background: "var(--input-bg)",
                                border: `1.5px solid ${showDropdown ? "var(--accent)" : "var(--border)"}`,
                                borderRadius: showDropdown ? "var(--radius-md) var(--radius-md) 0 0" : "var(--radius-md)",
                                padding: "9px 34px 9px 26px", color: "var(--input-color)",
                                fontSize: "0.93em", outline: "none",
                                transition: "border-color 0.15s var(--ease-out), box-shadow 0.15s var(--ease-out)",
                                boxShadow: showDropdown ? "0 0 0 3px var(--accent-bg)" : "none",
                            }}
                        />
                        {query && (
                            <button onClick={() => { onClear(); setAcActive(false); setAcIndex(-1); }} title="Clear"
                                style={{ position: "absolute", right: 6, background: "none", border: "none", color: "var(--text-faint)", cursor: "pointer", fontSize: "1.2em", lineHeight: 1, padding: "3px 5px", borderRadius: "var(--radius-sm)" }}
                                onMouseEnter={e => { e.currentTarget.style.color = "var(--btn-danger)"; e.currentTarget.style.background = "var(--surface)"; }}
                                onMouseLeave={e => { e.currentTarget.style.color = "var(--text-faint)"; e.currentTarget.style.background = "transparent"; }}>
                                ×
                            </button>
                        )}
                    </div>

                    {showDropdown && (
                        <div className="card" style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 300, borderTop: "none", borderRadius: "0 0 var(--radius-md) var(--radius-md)", boxShadow: "var(--shadow-md)", overflow: "hidden", animation: "fadeSlideUp 0.12s var(--ease-out)" }}>
                            {suggestions.map((s, i) => {
                                const isSelected = i === acIndex;
                                const typed = s.slice(0, query.length);
                                const rest = s.slice(query.length);
                                return (
                                    <div key={s} onMouseDown={() => pickSuggestion(s)} onMouseEnter={() => setAcIndex(i)}
                                        style={{ padding: "8px 12px", cursor: "pointer", background: isSelected ? "var(--accent-bg)" : "transparent", borderLeft: `2px solid ${isSelected ? "var(--accent)" : "transparent"}`, display: "flex", alignItems: "center", gap: 6 }}>
                                        <span className="mono" style={{ fontSize: "0.86em", flex: 1 }}>
                                            <span style={{ color: "var(--text-faint)" }}>{typed}</span>
                                            <span style={{ color: "var(--text)", fontWeight: 600 }}>{rest}</span>
                                        </span>
                                        {isSelected && <span style={{ fontSize: "0.68em", color: "var(--text-faint)" }}>↵</span>}
                                    </div>
                                );
                            })}
                            <div style={{ padding: "5px 12px 7px", fontSize: "0.68em", color: "var(--text-faint)", borderTop: "1px solid var(--border-faint)" }}>
                                ↑↓ navigate · Tab / ↵ select · Esc close
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <button onClick={onRun}
                style={{ flex: isMobile ? 1 : undefined, padding: "9px 22px", background: "var(--accent-strong)", border: "none", borderRadius: "var(--radius-md)", color: "#ffffff", cursor: "pointer", fontSize: "0.89em", whiteSpace: "nowrap", fontWeight: 600, boxShadow: "0 1px 2px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.06) inset" }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--accent)"}
                onMouseLeave={e => e.currentTarget.style.background = "var(--accent-strong)"}>
                Run ▶
            </button>
        </div>
    );
}