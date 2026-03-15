"use client";
import { Settings } from "@/theme";
import { QueryMatch, QueryResult } from "@/types/query";
import { CopyButton } from "@/components/copy-button";

interface Props {
    queryResult: QueryResult | null;
    resultView: string;
    setResultView: (v: string) => void;
    settings: Settings;
}

export function ResultsPanel({ queryResult, resultView, setResultView, settings }: Props) {
    if (!queryResult) return (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-faint)", fontSize: "0.93em", flexDirection: "column", gap: 8 }}>
            <div style={{ fontSize: "2em" }}>⌥</div>
            <div>Run a query to see results</div>
        </div>
    );

    const isError = "error" in queryResult;
    const results: QueryMatch[] = "results" in queryResult ? queryResult.results : [];

    const copyAllText = (): string => {
        const r = "results" in queryResult ? (queryResult.results ?? []) : [];
        if (resultView === "json") return JSON.stringify(r.map(x => x.value), null, 2);
        if (resultView === "path") return r.map((x, i) => `${i + 1}. ${x.path}`).join("\n");
        return ["#\tVALUE\tPATH", ...r.map((x, i) => `${i + 1}\t${JSON.stringify(x.value)}\t${x.path}`)].join("\n");
    };

    return (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {/* Header */}
            <div style={{ padding: "8px 12px", display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid var(--border-faint)", background: "var(--panel)", flexShrink: 0, flexWrap: "wrap" }}>
                <span style={{ color: "var(--text-dim)", fontSize: "0.86em", letterSpacing: 1.5, fontWeight: 600 }}>RESULTS</span>
                {!isError && <span style={{ color: "var(--accent)", fontSize: "0.93em" }}>({results.length})</span>}
                <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}>
                    <div style={{ display: "flex", gap: 2 }}>
                        {["json", "table", "path"].map(v => (
                            <button key={v} onClick={() => setResultView(v)}
                                style={{ padding: "4px 10px", background: resultView === v ? "var(--accent-bg)" : "none", border: resultView === v ? "1px solid var(--accent)" : "1px solid transparent", borderRadius: 4, color: resultView === v ? "var(--text)" : "var(--text-faint)", cursor: "pointer", fontSize: "0.93em" }}>
                                {v}
                            </button>
                        ))}
                    </div>
                    {!isError && results.length > 0 && <CopyButton text={copyAllText()} label="Copy All" size="sm" />}
                </div>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
                {isError ? (
                    <div style={{ color: "var(--btn-danger)", fontFamily: "monospace", fontSize: "0.93em", background: "var(--danger)", border: "1px solid var(--danger-border)", borderRadius: 6, padding: "10px 14px" }}>
                        ⚠ {queryResult.error}
                    </div>
                ) : resultView === "json" ? (
                    <pre style={{ color: "var(--text)", fontFamily: "monospace", fontSize: "0.93em", lineHeight: 1.7, whiteSpace: settings.wordWrap !== false ? "pre-wrap" : "pre", wordBreak: "break-word", margin: 0 }}>
                        {JSON.stringify(results.map(r => r.value), null, 2)}
                    </pre>
                ) : resultView === "path" ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        {results.map((r, i) => (
                            <div key={i}
                                style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 5, borderBottom: "1px solid var(--border-faint)" }}
                                onMouseEnter={e => (e.currentTarget.style.background = "var(--surface)")}
                                onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                                {settings.lineNumbers !== false && (
                                    <span style={{ color: "var(--text-faint)", fontSize: "0.79em", flexShrink: 0, width: 22, textAlign: "right" }}>{i + 1}.</span>
                                )}
                                <span style={{ fontFamily: "monospace", fontSize: "0.93em", color: "var(--node-key)", wordBreak: "break-all", flex: 1 }}>{r.path}</span>
                                <CopyButton text={r.path} label="" size="xs" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "monospace", fontSize: "0.93em" }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                                    {settings.lineNumbers !== false && <th style={{ textAlign: "left", color: "var(--text-dim)", padding: "6px 10px", fontSize: "0.79em", letterSpacing: 1 }}>#</th>}
                                    <th style={{ textAlign: "left", color: "var(--text-dim)", padding: "6px 10px", fontSize: "0.79em", letterSpacing: 1 }}>VALUE</th>
                                    <th style={{ textAlign: "left", color: "var(--text-dim)", padding: "6px 10px", fontSize: "0.79em", letterSpacing: 1 }}>PATH</th>
                                    <th style={{ width: 32 }} />
                                </tr>
                            </thead>
                            <tbody>
                                {results.map((r, i) => (
                                    <tr key={i}
                                        style={{ borderBottom: "1px solid var(--border-faint)" }}
                                        onMouseEnter={e => (e.currentTarget.style.background = "var(--surface)")}
                                        onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                                        {settings.lineNumbers !== false && (
                                            <td style={{ padding: "6px 10px", color: "var(--text-faint)", verticalAlign: "top" }}>{i + 1}</td>
                                        )}
                                        <td style={{ padding: "6px 10px", color: "var(--node-str)", wordBreak: "break-all", verticalAlign: "top" }}>{JSON.stringify(r.value)}</td>
                                        <td style={{ padding: "6px 10px", color: "var(--text-dim)", wordBreak: "break-all", verticalAlign: "top" }}>{r.path}</td>
                                        <td style={{ padding: "6px 4px", verticalAlign: "top" }}>
                                            <CopyButton text={JSON.stringify(r.value)} label="" size="xs" />
                                        </td>
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