"use client";
import { useState } from "react";
import { copyToClipboard, copyValueToClipboard } from "./clipboard";

interface Props {
    text?: string;
    value?: unknown;   // pass this for large JSON instead of pre-stringified text
    label?: string;
    size?: "xs" | "sm" | "md";
}

export function CopyButton({ text, value, label = "Copy", size = "sm" }: Props) {
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(false);

    const padding = size === "xs" ? "2px 7px" : size === "sm" ? "4px 10px" : "6px 14px";
    const fontSize = size === "xs" ? "0.79em" : size === "sm" ? "0.93em" : "1em";

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
                padding, borderRadius: 5, cursor: loading ? "wait" : "pointer",
                fontSize, fontFamily: "monospace", whiteSpace: "nowrap",
                background: copied ? "var(--success-bg)" : "var(--surface)",
                border: `1px solid ${copied ? "var(--success-border)" : "var(--border)"}`,
                color: copied ? "var(--success)" : loading ? "var(--text-faint)" : "var(--text-dim)",
                display: "flex", alignItems: "center", gap: 4, transition: "all 0.15s",
                opacity: loading ? 0.7 : 1,
            }}
        >
            {loading ? "⟳ Copying…" : copied ? "✓ Copied" : `⎘ ${label}`}
        </button>
    );
}