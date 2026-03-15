"use client";
import { CopyButton } from "@/components/copy-button";

interface SelectedNode {
    path: string;
    type: string;
    value: unknown;
}

interface Props {
    selectedNode: SelectedNode | null;
    setSelectedNode: (n: null) => void;
    isMobile: boolean;
}

export function NodeInspector({ selectedNode, setSelectedNode, isMobile }: Props) {
    if (!selectedNode) return null;

    return (
        <div style={{ borderTop: "1px solid var(--border-faint)", padding: isMobile ? 12 : 14, background: "var(--panel)", flexShrink: 0 }}>
            <div style={{ color: "var(--text-dim)", fontSize: "0.79em", letterSpacing: 2, marginBottom: 12, fontWeight: 600 }}>
                NODE INSPECTOR
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "60px 1fr", gap: "8px 12px", fontSize: "0.93em", marginBottom: 12 }}>
                <span style={{ color: "var(--text-faint)", paddingTop: 2 }}>Path</span>
                <span style={{ color: "var(--node-key)", fontFamily: "monospace", wordBreak: "break-all", lineHeight: 1.5 }}>
                    {selectedNode.path}
                </span>
                <span style={{ color: "var(--text-faint)", paddingTop: 2 }}>Type</span>
                <span style={{ color: "var(--node-num)" }}>{selectedNode.type}</span>
                <span style={{ color: "var(--text-faint)", paddingTop: 2 }}>Value</span>
                <span style={{ color: "var(--node-str)", fontFamily: "monospace", wordBreak: "break-all", lineHeight: 1.5 }}>
                    {JSON.stringify(selectedNode.value)}
                </span>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <CopyButton text={selectedNode.path} label="Copy Path" size="sm" />
                <CopyButton text={JSON.stringify(selectedNode.value)} label="Copy Value" size="sm" />
                <button
                    onClick={() => setSelectedNode(null)}
                    style={{ marginLeft: "auto", padding: "4px 10px", background: "none", border: "1px solid var(--border)", borderRadius: 5, color: "var(--text-faint)", cursor: "pointer", fontSize: "1.14em", lineHeight: 1 }}>
                    ×
                </button>
            </div>
        </div>
    );
}