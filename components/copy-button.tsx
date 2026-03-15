"use client";
import { useState } from "react";
import { copyToClipboard } from "./clipboard";


interface Props {
    text: string;
    label?: string;
    size?: "xs" | "sm" | "md";
}

export function CopyButton({ text, label = "Copy", size = "sm" }: Props) {
    const [copied, setCopied] = useState(false);

    const padding = size === "xs" ? "2px 7px" : size === "sm" ? "4px 10px" : "6px 14px";
    const fontSize = size === "xs" ? "0.79em" : size === "sm" ? "0.93em" : "1em";

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        copyToClipboard(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1400);
    };

    return (
        <button
            onClick={handleClick}
            style={{
                padding,
                borderRadius: 5,
                cursor: "pointer",
                fontSize,
                fontFamily: "monospace",
                whiteSpace: "nowrap",
                background: copied ? "var(--success-bg)" : "var(--surface)",
                border: `1px solid ${copied ? "var(--success-border)" : "var(--border)"}`,
                color: copied ? "var(--success)" : "var(--text-dim)",
                display: "flex",
                alignItems: "center",
                gap: 4,
                transition: "all 0.15s",
            }}
        >
            {copied ? "✓ Copied" : `⎘ ${label}`}
        </button>
    );
}