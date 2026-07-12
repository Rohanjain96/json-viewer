"use client";
import { useState } from "react";
import { copyToClipboard, copyValueToClipboard } from "./clipboard";

interface Props {
    text?: string;
    value?: unknown;
    label?: string;
    size?: "xs" | "sm" | "md";
}

export function CopyButton({ text, value, label = "Copy", size = "sm" }: Props) {
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(false);

    const padding = size === "xs" ? "3px 8px" : size === "sm" ? "5px 11px" : "7px 15px";
    const fontSize = size === "xs" ? "0.76em" : size === "sm" ? "0.82em" : "0.9em";

    const handleClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (loading) return;
        if (value !== undefined) {
            setLoading(true);
            await copyValueToClipboard(value);
            setLoading(false);
        } else {
            copyToClipboard(text ?? "");
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 1400);
    };

    return (
        <button
            onClick={handleClick}
            disabled={loading}
            style={{
                padding, borderRadius: "var(--radius-sm)", cursor: loading ? "wait" : "pointer",
                fontSize, fontWeight: 500, whiteSpace: "nowrap",
                background: copied ? "var(--success-bg)" : "var(--surface)",
                border: `1px solid ${copied ? "var(--success-border)" : "var(--border)"}`,
                color: copied ? "var(--success)" : loading ? "var(--text-faint)" : "var(--text-dim)",
                display: "flex", alignItems: "center", gap: 5, opacity: loading ? 0.7 : 1,
            }}
            onMouseEnter={e => { if (!copied && !loading) { e.currentTarget.style.borderColor = "var(--border-strong)"; e.currentTarget.style.color = "var(--text)"; } }}
            onMouseLeave={e => { if (!copied && !loading) { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-dim)"; } }}
        >
            {loading ? "⟳ Copying…" : copied ? "✓ Copied" : label ? `⎘ ${label}` : "⎘"}
        </button>
    );
}