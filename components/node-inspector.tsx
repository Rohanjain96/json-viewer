"use client";
import { CopyButton } from "@/components/copy-button";

interface SelectedNode { path: string; type: string; value: unknown; }
interface Props { selectedNode: SelectedNode | null; setSelectedNode: (n: null) => void; isMobile: boolean; }

export function NodeInspector({ selectedNode, setSelectedNode, isMobile }: Props) {
    if (!selectedNode) return null;

    return (
        <div style={{ borderTop: "1px solid var(--border-faint)", padding: isMobile ? 14 : 16, background: "var(--panel)", flexShrink: 0, animation: "fadeSlideUp 0.15s var(--ease-out)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ color: "var(--text)", fontSize: "0.78em", letterSpacing: 0.6, fontWeight: 600, textTransform: "uppercase" }}>
                    Node Inspector
                </div>
                <button onClick={() => setSelectedNode(null)}
                    style={{ padding: "3px 7px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", color: "var(--text-faint)", cursor: "pointer", fontSize: "1em", lineHeight: 1 }}>
                    ×
                </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "56px 1fr", gap: "9px 12px", fontSize: "0.88em", marginBottom: 14 }}>
                <span style={{ color: "var(--text-faint)", paddingTop: 2, fontWeight: 500 }}>Path</span>
                <span className="mono" style={{ color: "var(--node-key)", wordBreak: "break-all", lineHeight: 1.5 }}>{selectedNode.path}</span>
                <span style={{ color: "var(--text-faint)", paddingTop: 2, fontWeight: 500 }}>Type</span>
                <span>
                    <span style={{ fontSize: "0.85em", fontWeight: 600, color: "var(--node-num)", background: "var(--surface)", border: "1px solid var(--border-faint)", borderRadius: "var(--radius-full)", padding: "1px 9px" }} className="mono">
                        {selectedNode.type}
                    </span>
                </span>
                <span style={{ color: "var(--text-faint)", paddingTop: 2, fontWeight: 500 }}>Value</span>
                <span className="mono" style={{ color: "var(--node-str)", wordBreak: "break-all", lineHeight: 1.5 }}>{JSON.stringify(selectedNode.value)}</span>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <CopyButton text={selectedNode.path} label="Copy Path" size="sm" />
                <CopyButton text={JSON.stringify(selectedNode.value)} label="Copy Value" size="sm" />
            </div>
        </div>
    );
}