"use client";
import React, { useState } from "react";
import { JSONValue } from "@/types/json";
import { CopyIcon } from "@/icons/copy-icon";
import { CheckIcon } from "@/icons/check-icon";
import { Settings } from "@/theme";

let _showCopyModal: ((text: string) => void) | null = null;

export function registerCopyModal(fn: (text: string) => void) {
    _showCopyModal = fn;
}

function execCommandCopy(text: string): boolean {
    try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.cssText =
            "position:fixed;top:0;left:0;width:1px;height:1px;opacity:0.01;border:none;outline:none;box-shadow:none;background:transparent";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(ta);
        return ok;
    } catch {
        return false;
    }
}

export function copyToClipboard(text: string) {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        navigator.clipboard.writeText(text).catch(() => {
            if (!execCommandCopy(text)) _showCopyModal?.(text);
        });
        return;
    }
    if (!execCommandCopy(text)) _showCopyModal?.(text);
}

interface NodeClickPayload {
    path: string;
    type: string;
    value: JSONValue;
}

interface TreeNodeProps {
    nodeKey?: string | number;
    value: JSONValue;
    depth?: number;
    path?: string;
    isMobile: boolean;
    settings?: Partial<Settings>;
    onNodeClick: (payload: NodeClickPayload) => void;
}

export const TreeNode = React.memo(function TreeNode({
    nodeKey,
    value,
    depth = 0,
    path = "",
    isMobile,
    settings = {},
    onNodeClick,
}: TreeNodeProps) {
    const collapseAt =
        settings.collapseDepth === "All" ? 999 : parseInt(settings.collapseDepth ?? "2");

    const [open, setOpen] = useState<boolean>(depth < collapseAt);
    const [hovered, setHovered] = useState<boolean>(false);
    const [copiedNode, setCopiedNode] = useState<boolean>(false);
    const [visibleCount, setVisibleCount] = useState(200);

    const isObj = typeof value === "object" && value !== null && !Array.isArray(value);
    const isArr = Array.isArray(value);
    const isComplex = isObj || isArr;

    const nodePath = path
        ? typeof nodeKey === "number" ? `${path}[${nodeKey}]` : `${path}.${nodeKey}`
        : String(nodeKey ?? "");

    const typeColor = (): string => {
        if (value === null) return "var(--node-null)";
        switch (typeof value) {
            case "boolean": return "var(--node-bool)";
            case "number": return "var(--node-num)";
            case "string": return "var(--node-str)";
            default: return "var(--text-dim)";
        }
    };

    const typeTag = (): string => {
        if (value === null) return "null";
        if (isArr) return `${(value as unknown[]).length}`;
        if (isObj) return `${Object.keys(value as object).length}`;
        return typeof value;
    };

    const doCopy = (e: React.MouseEvent<HTMLButtonElement>, what: string) => {
        e.stopPropagation();
        const keyStr = typeof nodeKey === "number" ? `[${nodeKey}]` : String(nodeKey);
        let text: string;
        if (what === "key") {
            text = keyStr;
        } else if (isComplex) {
            text = JSON.stringify({ [keyStr]: value }, null, 2);
        } else {
            const valStr = typeof value === "string" ? `"${value}"` : String(value);
            text = `"${keyStr}": ${valStr}`;
        }
        copyToClipboard(text);
        setCopiedNode(true);
        setTimeout(() => setCopiedNode(false), 1400);
    };

    const entries = isComplex ? Object.entries(value as Record<string, JSONValue>) : [];

    return (
        <div style={{ paddingLeft: depth === 0 ? 0 : 18, borderLeft: depth > 0 ? "1px solid var(--border-faint)" : "none", marginLeft: depth > 0 ? 6 : 0 }}>
            <div
                className="tree-row"
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                onClick={() => {
                    if (isComplex) {
                        if (open) setVisibleCount(200);
                        setOpen(!open);
                    } else {
                        onNodeClick({ path: nodePath, type: typeof value, value });
                    }
                }}
                style={{
                    display: "flex", alignItems: "center",
                    padding: isMobile ? "7px 8px" : "5px 8px",
                    cursor: "pointer", borderRadius: "var(--radius-sm)",
                    gap: 7, position: "relative",
                    minHeight: isMobile ? 34 : 30,
                }}
            >
                <span style={{
                    color: "var(--text-faint)", fontSize: "0.86em", width: 16, flexShrink: 0,
                    userSelect: "none", lineHeight: 1, display: "inline-flex", alignItems: "center", justifyContent: "center",
                    transform: isComplex ? (open ? "rotate(90deg)" : "rotate(0deg)") : "none",
                    transition: "transform 0.15s var(--ease-out)",
                }}>
                    {isComplex ? "▸" : ""}
                </span>

                {nodeKey !== undefined && (
                    <span style={{ color: "var(--node-key)", fontFamily: "monospace", flexShrink: 0, fontWeight: 500 }}>
                        {typeof nodeKey === "number" ? `[${nodeKey}]` : nodeKey}
                        <span style={{ color: "var(--text-faint)", marginLeft: 3, fontWeight: 400 }}>:</span>
                    </span>
                )}

                {isComplex ? (
                    <span style={{ color: "var(--text-faint)", fontFamily: "monospace" }}>
                        {isArr ? "[" : "{"}
                        {!open && (
                            <span style={{ color: "var(--text-faint)" }}>
                                {isArr ? `${(value as unknown[]).length} items` : `${Object.keys(value as object).length} keys`}
                                {isArr ? "]" : "}"}
                            </span>
                        )}
                    </span>
                ) : (
                    <span style={{ color: typeColor(), fontFamily: "monospace", wordBreak: "break-all" }}>
                        {typeof value === "string" ? `"${value}"` : String(value)}
                    </span>
                )}

                {!isMobile && settings.typeHints !== false && (
                    <span style={{
                        marginLeft: "auto", flexShrink: 0, paddingRight: 36,
                        opacity: hovered ? 0 : 1, transition: "opacity 0.15s var(--ease-out)",
                        display: "flex", alignItems: "center", gap: 5,
                    }}>
                        <span style={{
                            fontSize: "0.68em", fontFamily: "monospace", fontWeight: 600,
                            color: "var(--text-faint)", background: "var(--surface)",
                            border: "1px solid var(--border-faint)", borderRadius: 999,
                            padding: "1px 7px", letterSpacing: 0.3,
                        }}>
                            {value === null ? "null" : isArr ? `arr·${typeTag()}` : isObj ? `obj·${typeTag()}` : typeTag()}
                        </span>
                    </span>
                )}

                <button
                    onClick={(e) => doCopy(e, "val")}
                    title="Copy"
                    style={{
                        position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)",
                        opacity: hovered || isMobile ? 1 : 0,
                        pointerEvents: hovered || isMobile ? "auto" : "none",
                        transition: "opacity 0.15s var(--ease-out)",
                        background: copiedNode ? "var(--success-bg)" : "var(--panel)",
                        border: `1px solid ${copiedNode ? "var(--success-border)" : "var(--border)"}`,
                        borderRadius: "var(--radius-sm)", padding: "3px 7px", cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 4,
                        color: copiedNode ? "var(--success)" : "var(--text-dim)",
                        fontSize: "0.86em", fontFamily: "monospace",
                        boxShadow: "var(--shadow-sm)",
                    }}
                >
                    {copiedNode ? <CheckIcon size={13} /> : <CopyIcon size={13} />}
                </button>
            </div>

            {isComplex && open && (
                <>
                    {entries.slice(0, visibleCount).map(([k, v]) => (
                        <TreeNode
                            key={k}
                            nodeKey={isArr ? Number(k) : k}
                            value={v}
                            depth={depth + 1}
                            path={nodePath}
                            onNodeClick={onNodeClick}
                            isMobile={isMobile}
                            settings={settings}
                        />
                    ))}
                    {visibleCount < entries.length && (
                        <div
                            onClick={() => setVisibleCount(c => Math.min(c + 200, entries.length))}
                            style={{
                                padding: "5px 8px 5px 26px", color: "var(--accent)", fontSize: "0.79em",
                                fontFamily: "monospace", cursor: "pointer", display: "flex",
                                alignItems: "center", gap: 6, borderRadius: "var(--radius-sm)",
                                transition: "background 0.12s var(--ease-out)",
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = "var(--surface)")}
                            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                        >
                            ▸ Show {Math.min(200, entries.length - visibleCount)} more
                            <span style={{ color: "var(--text-faint)" }}>({entries.length - visibleCount} remaining)</span>
                        </div>
                    )}
                    <div style={{ paddingLeft: 18, color: "var(--text-faint)", fontFamily: "monospace" }}>
                        {isArr ? "]" : "}"}
                    </div>
                </>
            )}
        </div>
    );
});