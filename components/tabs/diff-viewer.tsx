"use client";
import { useState } from "react";
import { useBreakpoint } from "@/hooks/use-breakpoints";
import { diffJSON, DiffChange } from "@/utils/json-diff";

export function DiffViewer() {
    const { isMobile } = useBreakpoint();
    const [leftText, setLeftText] = useState("");
    const [rightText, setRightText] = useState("");
    const [diffs, setDiffs] = useState<DiffChange[]>([]);
    const [error, setError] = useState("");
    const [ran, setRan] = useState(false);

    const runDiff = () => {
        setError("");
        setTimeout(() => {
            try {
                setDiffs(diffJSON(JSON.parse(leftText), JSON.parse(rightText)));
                setRan(true);
            } catch {
                setError("Invalid JSON — check both panels");
            }
        }, 0);
    };

    const taStyle: React.CSSProperties = {
        width: "100%", background: "var(--input-bg)", border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)", padding: "12px 14px", color: "var(--input-color)",
        fontFamily: "var(--font-mono)", fontSize: "0.9em", lineHeight: 1.6, outline: "none",
        resize: "vertical", transition: "border-color 0.15s var(--ease-out), box-shadow 0.15s var(--ease-out)",
        boxSizing: "border-box",
    };

    const diffBg: Record<string, string> = { added: "var(--success-bg)", removed: "var(--danger)", changed: "var(--accent-bg)" };
    const diffClr: Record<string, string> = { added: "var(--success)", removed: "var(--btn-danger)", changed: "var(--accent)" };
    const diffIcon: Record<string, string> = { added: "+", removed: "−", changed: "~" };

    const added = diffs.filter((d) => d.type === "added").length;
    const removed = diffs.filter((d) => d.type === "removed").length;
    const changed = diffs.filter((d) => d.type === "changed").length;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 14 }}>
                {[
                    { id: "jsonA", label: "JSON A · original", val: leftText, set: setLeftText, placeholder: 'Paste original JSON here...\n\nExample:\n{\n  "name": "John",\n  "age": 30\n}' },
                    { id: "jsonB", label: "JSON B · modified", val: rightText, set: setRightText, placeholder: 'Paste modified JSON here...\n\nExample:\n{\n  "name": "John Doe",\n  "age": 31\n}' },
                ].map(({ id, label, val, set, placeholder }) => (
                    <div key={id} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
                        <label htmlFor={id} style={{ color: "var(--text-dim)", fontSize: "0.78em", fontWeight: 600, letterSpacing: 0.4 }}>{label}</label>
                        <textarea placeholder={placeholder} id={id} value={val} onChange={(e) => set(e.target.value)} rows={isMobile ? 6 : 10}
                            style={taStyle}
                            onFocus={e => { e.target.style.borderColor = "var(--accent)"; e.target.style.boxShadow = "0 0 0 3px var(--accent-bg)"; }}
                            onBlur={e => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }} />
                    </div>
                ))}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                <button onClick={runDiff}
                    style={{ padding: "9px 24px", background: "var(--accent-strong)", border: "none", borderRadius: "var(--radius-md)", color: "#ffffff", cursor: "pointer", fontSize: "0.9em", fontWeight: 600, boxShadow: "var(--shadow-button)" }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--accent)"}
                    onMouseLeave={e => e.currentTarget.style.background = "var(--accent-strong)"}>
                    Compare →
                </button>
                {ran && !error && (
                    <div className="mono" style={{ display: "flex", gap: 16, fontSize: "0.85em" }}>
                        {added > 0 && <span style={{ color: "var(--success)" }}>+{added} added</span>}
                        {removed > 0 && <span style={{ color: "var(--btn-danger)" }}>−{removed} removed</span>}
                        {changed > 0 && <span style={{ color: "var(--accent)" }}>~{changed} changed</span>}
                        {diffs.length === 0 && <span style={{ color: "var(--text-dim)" }}>✓ Identical</span>}
                    </div>
                )}
            </div>

            {error && (
                <div className="mono" style={{ background: "var(--danger)", border: "1px solid var(--danger-border)", borderRadius: "var(--radius-md)", padding: "11px 15px", color: "var(--btn-danger)", fontSize: "0.85em" }}>
                    ⚠ {error}
                </div>
            )}

            {ran && !error && diffs.length > 0 && (
                <div className="card" style={{ overflow: "hidden" }}>
                    <div style={{ padding: "11px 15px", borderBottom: "1px solid var(--border-faint)", display: "flex", gap: 20, flexWrap: "wrap", background: "var(--surface)" }}>
                        {["added", "removed", "changed"].map((type) => (
                            <span key={type} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.8em", fontWeight: 500, color: diffClr[type] }}>
                                <span className="mono" style={{ fontWeight: 700 }}>{diffIcon[type]}</span>
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                            </span>
                        ))}
                    </div>

                    <div style={{ maxHeight: 360, overflowY: "auto", padding: "8px 0" }}>
                        {diffs.map((d, i) => (
                            <div key={i} className="mono" style={{ display: "flex", gap: 10, alignItems: "baseline", padding: "7px 15px", fontSize: "0.86em", background: diffBg[d.type], borderRadius: "var(--radius-sm)", marginBottom: 2 }}>
                                <span style={{ color: diffClr[d.type], fontWeight: 700, flexShrink: 0, width: 14 }}>{diffIcon[d.type]}</span>
                                <span style={{ color: "var(--node-key)", flexShrink: 0, minWidth: 80 }}>{d.path || "(root)"}</span>
                                <span style={{ color: "var(--text-dim)", wordBreak: "break-all" }}>
                                    {d.type === "changed" ? (
                                        <>
                                            <span style={{ color: "var(--btn-danger)", textDecoration: "line-through", marginRight: 6 }}>{JSON.stringify(d.from)}</span>
                                            <span style={{ color: "var(--text-faint)", marginRight: 6 }}>→</span>
                                            <span style={{ color: "var(--success)" }}>{JSON.stringify(d.to)}</span>
                                        </>
                                    ) : (
                                        <span style={{ color: d.type === "added" ? "var(--success)" : "var(--btn-danger)" }}>{JSON.stringify((d).value ?? d.from)}</span>
                                    )}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {ran && !error && diffs.length === 0 && (
                <div style={{ background: "var(--success-bg)", border: "1px solid var(--success-border)", borderRadius: "var(--radius-md)", padding: "15px 19px", color: "var(--success)", fontSize: "0.92em", fontWeight: 500 }}>
                    ✓ The two JSON values are identical.
                </div>
            )}
        </div>
    );
}