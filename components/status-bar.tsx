"use client";
import { QueryResult } from "@/types/query";

interface Props { activeTab: string; selectedNodePath: string | null; queryResult: QueryResult | null; }

export function StatusBar({ activeTab, selectedNodePath, queryResult }: Props) {
    const message = selectedNodePath ? `Path: ${selectedNodePath}` : activeTab === "paste" ? "Paste your JSON then click Apply →" : "Hover any node to copy its value";
    const resultCount = queryResult && !("error" in queryResult) ? `${queryResult.results?.length} result(s)` : "";

    return (
        <div style={{ background: "var(--panel)", borderTop: "1px solid var(--border-faint)", padding: "5px 20px", display: "flex", gap: 20, alignItems: "center", flexShrink: 0, height: 28 }}>
            <span className={selectedNodePath ? "mono" : ""} style={{ color: "var(--text-faint)", fontSize: "0.76em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {message}
            </span>
            <span className="mono" style={{ color: "var(--accent)", fontSize: "0.76em", marginLeft: "auto", whiteSpace: "nowrap", fontWeight: 600 }}>
                {resultCount}
            </span>
            <span style={{ color: "var(--text-faint)", fontSize: "0.76em", whiteSpace: "nowrap", opacity: 0.7 }}>
                JSON Explorer v1.0
            </span>
        </div>
    );
}