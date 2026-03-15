"use client";

import { MOCK_JSON_SNIPPET, QUERY_EXAMPLES } from "@/data/query-examples";


interface Props {
    open: boolean;
    onToggle: () => void;
    onSelectExample: (query: string) => void;
}

export function QueryExamplesDrawer({ open, onToggle, onSelectExample }: Props) {
    return (
        <div style={{ borderTop: "1px solid var(--border)", flexShrink: 0, background: "var(--panel)" }}>
            {/* Header toggle */}
            <div
                onClick={onToggle}
                style={{ padding: "8px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", userSelect: "none" }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--surface)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: "1.3em" }}>💡</span>
                    <span style={{ color: "var(--text-dim)", fontSize: "0.72em", letterSpacing: 1.5, fontWeight: 600, fontFamily: "monospace" }}>
                        QUERY EXAMPLES
                    </span>
                    <span style={{ background: "var(--accent-bg)", color: "var(--accent)", fontSize: "0.64em", fontFamily: "monospace", padding: "1px 6px", borderRadius: 8, border: "1px solid var(--accent)" }}>
                        MOCK JSON
                    </span>
                </div>
                <span style={{ color: "var(--text-faint)", fontSize: "1.34em", display: "inline-block", transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                    ▾
                </span>
            </div>

            {/* Content */}
            {open && (
                <div style={{ maxHeight: 320, overflowY: "auto", borderTop: "1px solid var(--border-faint)" }}>
                    {/* Mock JSON structure */}
                    <div style={{ padding: "8px 14px 4px", borderBottom: "1px solid var(--border-faint)" }}>
                        <div style={{ color: "var(--text-faint)", fontSize: "0.64em", letterSpacing: 1, fontFamily: "monospace", marginBottom: 4, fontWeight: 600 }}>
                            MOCK DATA STRUCTURE
                        </div>
                        <pre style={{ fontFamily: "monospace", fontSize: "0.72em", color: "var(--text-dim)", lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                            {MOCK_JSON_SNIPPET}
                        </pre>
                    </div>

                    {/* Examples */}
                    {QUERY_EXAMPLES.map((ex, i) => (
                        <div key={i}
                            onClick={() => onSelectExample(ex.query)}
                            style={{ padding: "8px 14px", borderBottom: "1px solid var(--border-faint)", cursor: "pointer" }}
                            onMouseEnter={e => (e.currentTarget.style.background = "var(--surface)")}
                            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                        >
                            <div style={{ fontFamily: "monospace", fontSize: "0.79em", color: "var(--accent)", wordBreak: "break-all", marginBottom: 3 }}>
                                {ex.query}
                            </div>
                            <div style={{ display: "flex", gap: 6, alignItems: "baseline", flexWrap: "wrap" }}>
                                <span style={{ fontSize: "0.72em", color: "var(--text)", fontWeight: 600, fontFamily: "monospace" }}>{ex.label}</span>
                                <span style={{ fontSize: "0.64em", color: "var(--text-faint)", fontFamily: "monospace" }}>— {ex.desc}</span>
                            </div>
                        </div>
                    ))}

                    <div style={{ padding: "8px 14px", color: "var(--text-faint)", fontSize: "0.64em", fontFamily: "monospace", textAlign: "center" }}>
                        Click any example to run it instantly
                    </div>
                </div>
            )}
        </div>
    );
}