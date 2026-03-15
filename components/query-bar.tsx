"use client";
import { useRef } from "react";

interface Props {
    query: string;
    setQuery: (q: string) => void;
    onRun: () => void;
    onClear: () => void;
    suggestions: string[];
    acActive: boolean;
    acIndex: number;
    setAcActive: (v: boolean) => void;
    setAcIndex: (fn: ((i: number) => number) | number) => void;
    isMobile: boolean;
    pad: number;
}

export function QueryBar({
    query, setQuery, onRun, onClear,
    suggestions, acActive, acIndex, setAcActive, setAcIndex,
    isMobile, pad,
}: Props) {
    const inputRef = useRef<HTMLInputElement>(null);

    const pickSuggestion = (s: string) => {
        setQuery(s);
        setAcActive(false);
        setAcIndex(-1);
        inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!acActive || suggestions.length === 0) {
            if (e.key === "Enter") onRun();
            return;
        }
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setAcIndex((i: number) => Math.min(i + 1, suggestions.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setAcIndex((i: number) => Math.max(i - 1, -1));
        } else if (e.key === "Tab") {
            e.preventDefault();
            pickSuggestion(acIndex >= 0 ? suggestions[acIndex] : suggestions[0]);
        } else if (e.key === "Enter") {
            if (acIndex >= 0) {
                e.preventDefault();
                pickSuggestion(suggestions[acIndex]);
            } else {
                setAcActive(false);
                onRun();
            }
        } else if (e.key === "Escape") {
            setAcActive(false);
            setAcIndex(-1);
        }
    };

    const showDropdown = acActive && suggestions.length > 0;

    return (
        <div style={{ background: "var(--panel)", borderBottom: "1px solid var(--border-faint)", padding: `${isMobile ? 8 : 10}px ${pad}px`, display: "flex", flexDirection: isMobile ? "column" : "row", gap: 8, flexShrink: 0 }}>
            <div style={{ display: "flex", gap: 6, flex: 1, alignItems: "center" }}>
                <span style={{ color: "var(--text-faint)", fontSize: "0.93em", flexShrink: 0, fontFamily: "monospace" }}>$</span>
                <div style={{ flex: 1, position: "relative" }}>
                    <div style={{ display: "flex", alignItems: "center" }}>
                        <input
                            ref={inputRef}
                            value={query}
                            onChange={e => { setQuery(e.target.value); setAcActive(true); setAcIndex(-1); }}
                            onFocus={() => setAcActive(true)}
                            onBlur={() => setTimeout(() => setAcActive(false), 150)}
                            onKeyDown={handleKeyDown}
                            placeholder="Enter JSONPath e.g. $.store.orders[*].status"
                            style={{
                                width: "100%",
                                background: "var(--input-bg)",
                                border: `1px solid ${showDropdown ? "var(--accent)" : "var(--border)"}`,
                                borderRadius: showDropdown ? "6px 6px 0 0" : "6px",
                                padding: "8px 32px 8px 12px",
                                color: "var(--input-color)",
                                fontFamily: "monospace",
                                fontSize: "0.93em",
                                outline: "none",
                                transition: "border-color 0.15s",
                            }}
                        />
                        {query && (
                            <button
                                onClick={() => { onClear(); setAcActive(false); setAcIndex(-1); }}
                                title="Clear"
                                style={{ position: "absolute", right: 6, background: "none", border: "none", color: "var(--text-faint)", cursor: "pointer", fontSize: "1.14em", lineHeight: 1, padding: "2px 4px", borderRadius: 3 }}
                                onMouseEnter={e => (e.currentTarget.style.color = "var(--btn-danger)")}
                                onMouseLeave={e => (e.currentTarget.style.color = "var(--text-faint)")}>
                                ×
                            </button>
                        )}
                    </div>

                    {/* Autocomplete dropdown */}
                    {showDropdown && (
                        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 300, background: "var(--surface)", border: "1px solid var(--accent)", borderTop: "none", borderRadius: "0 0 8px 8px", boxShadow: "0 8px 24px #0006", overflow: "hidden" }}>
                            {suggestions.map((s, i) => {
                                const isSelected = i === acIndex;
                                const typed = s.slice(0, query.length);
                                const rest = s.slice(query.length);
                                return (
                                    <div key={s}
                                        onMouseDown={() => pickSuggestion(s)}
                                        onMouseEnter={() => setAcIndex(i)}
                                        style={{ padding: "7px 12px", cursor: "pointer", background: isSelected ? "var(--accent-bg)" : "transparent", borderLeft: `2px solid ${isSelected ? "var(--accent)" : "transparent"}`, display: "flex", alignItems: "center", gap: 6, transition: "background 0.1s" }}>
                                        <span style={{ fontFamily: "monospace", fontSize: "0.86em", flex: 1 }}>
                                            <span style={{ color: "var(--text-faint)" }}>{typed}</span>
                                            <span style={{ color: "var(--text)", fontWeight: 600 }}>{rest}</span>
                                        </span>
                                        {isSelected && <span style={{ fontSize: "0.64em", color: "var(--text-faint)", fontFamily: "monospace" }}>↵</span>}
                                    </div>
                                );
                            })}
                            <div style={{ padding: "4px 12px 6px", fontSize: "0.64em", color: "var(--text-faint)", fontFamily: "monospace", borderTop: "1px solid var(--border-faint)" }}>
                                ↑↓ navigate · Tab / ↵ select · Esc close
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
                <button
                    onClick={onRun}
                    style={{ flex: isMobile ? 1 : undefined, padding: "8px 20px", background: "var(--accent)", border: "none", borderRadius: 6, color: "#ffffff", cursor: "pointer", fontSize: "0.93em", whiteSpace: "nowrap", fontWeight: 600 }}>
                    Run ▶
                </button>
            </div>
        </div>
    );
}