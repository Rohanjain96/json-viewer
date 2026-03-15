"use client";
import { QueryResult } from "@/types/query";

interface Props {
    activeTab: string;
    selectedNodePath: string | null;
    queryResult: QueryResult | null;
}

export function StatusBar({ activeTab, selectedNodePath, queryResult }: Props) {
    const message = selectedNodePath
        ? `Path: ${selectedNodePath}`
        : activeTab === "paste"
            ? "Paste your JSON then click Apply →"
            : "Hover any node to copy its value";

    const resultCount =
        queryResult && !("error" in queryResult)
            ? `${queryResult.results?.length} result(s)`
            : "";

    return (
        <div style={{ background: "var(--panel)", borderTop: "1px solid var(--border-faint)", padding: "4px 20px", display: "flex", gap: 20, alignItems: "center", flexShrink: 0 }}>
            <span style={{ color: "var(--text-dim)", fontSize: "0.79em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {message}
            </span>
            <span style={{ color: "var(--text-faint)", fontSize: "0.79em", marginLeft: "auto", whiteSpace: "nowrap" }}>
                {resultCount}
            </span>
            <span style={{ color: "var(--text-faint)", fontSize: "0.79em", whiteSpace: "nowrap" }}>
                JSON Explorer v1.0
            </span>
        </div>
    );
}