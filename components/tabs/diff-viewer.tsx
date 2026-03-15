"use client";
import { useEffect, useState } from "react";
import { useBreakpoint } from "@/hooks/use-breakpoints";
import { diffJSON, DiffChange } from "@/utils/json-diff";

export function DiffViewer() {
    const { isMobile } = useBreakpoint();

    const [leftText, setLeftText] = useState(
        ""
    );
    const [rightText, setRightText] = useState(

        ""
    );
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
        width: "100%",
        background: "var(--input-bg)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        padding: "10px 12px",
        color: "var(--input-color)",
        fontFamily: "monospace",
        fontSize: "0.93em",
        lineHeight: 1.6,
        outline: "none",
        resize: "vertical",
        transition: "border-color 0.15s",
    };

    const diffBg: Record<string, string> = {
        added: "var(--success-bg)",
        removed: "var(--danger)",
        changed: "var(--accent-bg)",
    };
    const diffClr: Record<string, string> = {
        added: "var(--success)",
        removed: "var(--btn-danger)",
        changed: "var(--accent)",
    };
    const diffIcon: Record<string, string> = {
        added: "+",
        removed: "−",
        changed: "~",
    };

    const added = diffs.filter((d) => d.type === "added").length;
    const removed = diffs.filter((d) => d.type === "removed").length;
    const changed = diffs.filter((d) => d.type === "changed").length;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Input panels */}
            <div
                style={{
                    display: "flex",
                    flexDirection: isMobile ? "column" : "row",
                    gap: 12,
                }}
            >
                {[
                    { id: "jsonA", label: "JSON A  (original)", val: leftText, set: setLeftText, placeholder: 'Paste original JSON here...\n\nExample:\n{\n  "name": "John",\n  "age": 30\n}' },
                    { id: "jsonB", label: "JSON B  (modified)", val: rightText, set: setRightText, placeholder: 'Paste modified JSON here...\n\nExample:\n{\n  "name": "John Doe",\n  "age": 31\n}' },
                ].map(({ id, label, val, set, placeholder }) => (
                    <div
                        key={id}
                        style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}
                    >
                        <label
                            htmlFor={id}
                            style={{
                                color: "var(--text-dim)",
                                fontSize: "0.79em",
                                fontFamily: "monospace",
                                fontWeight: 600,
                                letterSpacing: 1,
                            }}
                        >
                            {label}
                        </label>
                        <textarea
                            placeholder={placeholder}
                            id={id}
                            value={val}
                            onChange={(e) => set(e.target.value)}
                            rows={isMobile ? 6 : 10}
                            style={taStyle}
                            onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                            onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                        />
                    </div>
                ))}
            </div>

            {/* Compare button + summary */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                <button
                    onClick={runDiff}
                    style={{
                        padding: "8px 22px",
                        background: "var(--accent)",
                        border: "none",
                        borderRadius: 7,
                        color: "#ffffff",
                        cursor: "pointer",
                        fontFamily: "monospace",
                        fontSize: "0.93em",
                        fontWeight: 600,
                    }}
                >
                    Compare →
                </button>
                {ran && !error && (
                    <div style={{ display: "flex", gap: 14, fontSize: "0.86em", fontFamily: "monospace" }}>
                        {added > 0 && (
                            <span style={{ color: "var(--success)" }}>+{added} added</span>
                        )}
                        {removed > 0 && (
                            <span style={{ color: "var(--btn-danger)" }}>−{removed} removed</span>
                        )}
                        {changed > 0 && (
                            <span style={{ color: "var(--accent)" }}>~{changed} changed</span>
                        )}
                        {diffs.length === 0 && (
                            <span style={{ color: "var(--text-dim)" }}>✓ Identical</span>
                        )}
                    </div>
                )}
            </div>

            {/* Error */}
            {error && (
                <div
                    style={{
                        background: "var(--danger)",
                        border: "1px solid var(--danger-border)",
                        borderRadius: 7,
                        padding: "10px 14px",
                        color: "var(--btn-danger)",
                        fontSize: "0.86em",
                        fontFamily: "monospace",
                    }}
                >
                    ⚠ {error}
                </div>
            )}

            {/* Diff results */}
            {ran && !error && diffs.length > 0 && (
                <div
                    style={{
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        borderRadius: 10,
                        overflow: "hidden",
                    }}
                >
                    {/* Legend */}
                    <div
                        style={{
                            padding: "10px 14px",
                            borderBottom: "1px solid var(--border-faint)",
                            display: "flex",
                            gap: 18,
                            flexWrap: "wrap",
                            background: "var(--panel)",
                        }}
                    >
                        {["added", "removed", "changed"].map((type) => (
                            <span
                                key={type}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 5,
                                    fontSize: "0.79em",
                                    fontFamily: "monospace",
                                    color: diffClr[type],
                                }}
                            >
                                <span style={{ fontWeight: 700 }}>{diffIcon[type]}</span>
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                            </span>
                        ))}
                    </div>

                    {/* Rows */}
                    <div style={{ maxHeight: 360, overflowY: "auto", padding: "8px 0" }}>
                        {diffs.map((d, i) => (
                            <div
                                key={i}
                                style={{
                                    display: "flex",
                                    gap: 10,
                                    alignItems: "baseline",
                                    padding: "6px 14px",
                                    fontFamily: "monospace",
                                    fontSize: "0.86em",
                                    background: diffBg[d.type],
                                    borderLeft: `3px solid ${diffClr[d.type]}`,
                                    marginBottom: 2,
                                }}
                            >
                                <span style={{ color: diffClr[d.type], fontWeight: 700, flexShrink: 0, width: 14 }}>
                                    {diffIcon[d.type]}
                                </span>
                                <span style={{ color: "var(--node-key)", flexShrink: 0, minWidth: 80 }}>
                                    {d.path || "(root)"}
                                </span>
                                <span style={{ color: "var(--text-dim)", wordBreak: "break-all" }}>
                                    {d.type === "changed" ? (
                                        <>
                                            <span style={{ color: "var(--btn-danger)", textDecoration: "line-through", marginRight: 6 }}>
                                                {JSON.stringify(d.from)}
                                            </span>
                                            <span style={{ color: "var(--text-faint)", marginRight: 6 }}>→</span>
                                            <span style={{ color: "var(--success)" }}>
                                                {JSON.stringify(d.to)}
                                            </span>
                                        </>
                                    ) : (
                                        <span style={{ color: d.type === "added" ? "var(--success)" : "var(--btn-danger)" }}>
                                            {JSON.stringify((d).value ?? d.from)}
                                        </span>
                                    )}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Identical */}
            {ran && !error && diffs.length === 0 && (
                <div
                    style={{
                        background: "var(--success-bg)",
                        border: "1px solid var(--success-border)",
                        borderRadius: 8,
                        padding: "14px 18px",
                        color: "var(--success)",
                        fontFamily: "monospace",
                        fontSize: "0.93em",
                    }}
                >
                    ✓ The two JSON values are identical.
                </div>
            )}
        </div>
    );
}