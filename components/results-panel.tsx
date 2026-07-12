"use client";
import { useEffect, useState } from "react";
import { Settings } from "@/theme";
import { QueryMatch, QueryResult } from "@/types/query";
import { CopyButton } from "@/components/copy-button";
import { stringifyAsync } from "@/utils/copy-async";

interface Props {
    queryResult: QueryResult | null;
    queryRunning?: boolean;
    resultView: string;
    setResultView: (v: string) => void;
    settings: Settings;
}

export function ResultsPanel({ queryResult, queryRunning, resultView, setResultView, settings }: Props) {
    const [jsonText, setJsonText] = useState<string>("");
    const [stringifying, setStringifying] = useState(false);

    const results: QueryMatch[] = queryResult && "results" in queryResult ? queryResult.results : [];

    useEffect(() => {
        if (resultView !== "json" || !results.length) { setJsonText(""); return; }
        let cancelled = false;
        setStringifying(true);
        stringifyAsync(results.map(r => r.value), 2).then(str => {
            if (!cancelled) { setJsonText(str); setStringifying(false); }
        });
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [queryResult, resultView]);

    if (queryRunning) return (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 10, color: "var(--text-faint)" }}>
            <div style={{ width: 20, height: 20, border: "2px solid var(--border)", borderTop: "2px solid var(--accent)", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
            <span style={{ fontSize: "0.86em" }}>Running query…</span>
        </div>
    );

    if (!queryResult) return (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-faint)", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: "1.8em", opacity: 0.5 }} className="mono">⌥</div>
            <div style={{ fontSize: "0.86em" }}>Run a query to see results</div>
        </div>
    );

    const isError = "error" in queryResult;

    return (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "9px 14px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid var(--border-faint)", background: "var(--panel)", flexShrink: 0, flexWrap: "wrap" }}>
                <span style={{ color: "var(--text)", fontSize: "0.78em", letterSpacing: 0.6, fontWeight: 600, textTransform: "uppercase" }}>Results</span>
                {!isError && <span style={{ color: "var(--accent)", fontSize: "0.82em", fontWeight: 600 }} className="mono">{results.length}</span>}
                <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center" }}>
                    <div style={{ display: "flex", gap: 2, background: "var(--surface)", padding: 3, borderRadius: "var(--radius-md)", border: "1px solid var(--border-faint)" }}>
                        {["json", "table", "path"].map(v => (
                            <button key={v} onClick={() => setResultView(v)}
                                style={{ padding: "4px 11px", background: resultView === v ? "var(--panel)" : "none", boxShadow: resultView === v ? "var(--shadow-sm)" : "none", border: "none", borderRadius: "var(--radius-sm)", color: resultView === v ? "var(--text)" : "var(--text-faint)", cursor: "pointer", fontSize: "0.78em", fontWeight: resultView === v ? 600 : 500, textTransform: "capitalize" }}>
                                {v}
                            </button>
                        ))}
                    </div>
                    {!isError && results.length > 0 && <CopyButton value={results.map(r => r.value)} label="Copy All" size="sm" />}
                </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: 14 }}>
                {isError ? (
                    <div className="mono" style={{ color: "var(--btn-danger)", fontSize: "0.88em", background: "var(--danger)", border: "1px solid var(--danger-border)", borderRadius: "var(--radius-md)", padding: "11px 15px" }}>
                        ⚠ {queryResult.error}
                    </div>
                ) : resultView === "json" ? (
                    stringifying ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-faint)", fontSize: "0.86em" }}>
                            <div style={{ width: 14, height: 14, border: "2px solid var(--border)", borderTop: "2px solid var(--accent)", borderRadius: "50%", animation: "spin 0.6s linear infinite", flexShrink: 0 }} />
                            Formatting…
                        </div>
                    ) : (
                        <pre className="mono" style={{ color: "var(--text)", fontSize: "0.92em", lineHeight: 1.75, whiteSpace: settings.wordWrap !== false ? "pre-wrap" : "pre", wordBreak: "break-word", margin: 0 }}>
                            {jsonText}
                        </pre>
                    )
                ) : resultView === "path" ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        {results.map((r, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 9px", borderRadius: "var(--radius-sm)", borderBottom: "1px solid var(--border-faint)", transition: "background 0.12s var(--ease-out)" }}
                                onMouseEnter={e => (e.currentTarget.style.background = "var(--surface)")}
                                onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                                {settings.lineNumbers !== false && (
                                    <span className="mono" style={{ color: "var(--text-faint)", fontSize: "0.78em", flexShrink: 0, width: 22, textAlign: "right" }}>{i + 1}.</span>
                                )}
                                <span className="mono" style={{ fontSize: "0.9em", color: "var(--node-key)", wordBreak: "break-all", flex: 1 }}>{r.path}</span>
                                <CopyButton text={r.path} label="" size="xs" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9em" }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                                    {settings.lineNumbers !== false && <th style={{ textAlign: "left", color: "var(--text-dim)", padding: "7px 10px", fontSize: "0.72em", letterSpacing: 0.6, fontWeight: 600, textTransform: "uppercase" }}>#</th>}
                                    <th style={{ textAlign: "left", color: "var(--text-dim)", padding: "7px 10px", fontSize: "0.72em", letterSpacing: 0.6, fontWeight: 600, textTransform: "uppercase" }}>Value</th>
                                    <th style={{ textAlign: "left", color: "var(--text-dim)", padding: "7px 10px", fontSize: "0.72em", letterSpacing: 0.6, fontWeight: 600, textTransform: "uppercase" }}>Path</th>
                                    <th style={{ width: 32 }} />
                                </tr>
                            </thead>
                            <tbody>
                                {results.map((r, i) => (
                                    <tr key={i} style={{ borderBottom: "1px solid var(--border-faint)", transition: "background 0.12s var(--ease-out)" }}
                                        onMouseEnter={e => (e.currentTarget.style.background = "var(--surface)")}
                                        onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                                        {settings.lineNumbers !== false && <td className="mono" style={{ padding: "7px 10px", color: "var(--text-faint)", verticalAlign: "top" }}>{i + 1}</td>}
                                        <td className="mono" style={{ padding: "7px 10px", color: "var(--node-str)", wordBreak: "break-all", verticalAlign: "top" }}>{JSON.stringify(r.value)}</td>
                                        <td className="mono" style={{ padding: "7px 10px", color: "var(--text-dim)", wordBreak: "break-all", verticalAlign: "top" }}>{r.path}</td>
                                        <td style={{ padding: "6px 4px", verticalAlign: "top" }}><CopyButton value={r.value} label="Copy" size="xs" /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}