"use client";
import { useEffect, useMemo, useRef, useState } from "react";

const LINE_HEIGHT = 22;
const OVERSCAN = 10;

interface Props {
    text: string;
    onEdit: () => void;
    onDoneEdit: () => void;  // new — exits edit mode
    forceEdit: boolean;
    onChange: (t: string) => void;
    dragOver: boolean;
    error: string;
    loading: boolean;
}

export function VirtualTextView({ text, onEdit, onDoneEdit, forceEdit, onChange, dragOver, error, loading }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [scrollTop, setScrollTop] = useState(0);
    const [height, setHeight] = useState(400);

    const lines = useMemo(() => text.split("\n"), [text]);
    const totalHeight = lines.length * LINE_HEIGHT;

    useEffect(() => {
        if (!containerRef.current) return;
        const ro = new ResizeObserver(entries => {
            setHeight(entries[0].contentRect.height);
        });
        ro.observe(containerRef.current);
        return () => ro.disconnect();
    }, []);

    const startIdx = Math.max(0, Math.floor(scrollTop / LINE_HEIGHT) - OVERSCAN);
    const endIdx = Math.min(lines.length, Math.ceil((scrollTop + height) / LINE_HEIGHT) + OVERSCAN);
    const visibleLines = lines.slice(startIdx, endIdx);

    // Flush textarea content to parent and exit edit mode
    const handleDone = () => {
        if (textareaRef.current) {
            onChange(textareaRef.current.value);
        }
        onDoneEdit();
    };

    return (
        <div style={{ position: "relative", height: "100%", minHeight: 360 }}>

            {/* EDIT MODE — textarea sits behind the overlay button */}
            {forceEdit && (
                <>
                    <textarea
                        ref={textareaRef}
                        defaultValue={text}   // uncontrolled — no React diffing on keystrokes
                        autoFocus
                        spellCheck={false}
                        style={{
                            width: "100%", height: "100%", minHeight: 360,
                            background: "var(--input-bg)",
                            border: `1px solid ${error ? "var(--danger-border)" : "var(--border)"}`,
                            borderRadius: 8, padding: "16px 16px 48px 16px", // bottom pad for button
                            color: "var(--input-color)",
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: "0.86em", lineHeight: `${LINE_HEIGHT}px`,
                            outline: "none", resize: "vertical",
                            boxSizing: "border-box",
                            opacity: loading ? 0.6 : 1,
                        }}
                    />
                    {/* Done button — always visible in edit mode */}
                    <div style={{
                        position: "absolute", top: 10, right: 10,
                        display: "flex", gap: 6, zIndex: 10,
                    }}>
                        <button
                            onClick={handleDone}
                            style={{
                                padding: "2px 10px", background: "var(--accent)",
                                border: "none", borderRadius: 4,
                                color: "#fff", cursor: "pointer",
                                fontSize: "0.72em", fontFamily: "monospace",
                            }}
                        >
                            ✓ Done
                        </button>
                    </div>
                </>
            )}

            {/* READ-ONLY VIRTUAL SCROLL — always mounted so scroll position is preserved */}
            <div
                ref={containerRef}
                onScroll={e => setScrollTop(e.currentTarget.scrollTop)}
                style={{
                    display: forceEdit ? "none" : "block",  // hide but keep mounted
                    width: "100%", height: "100%", minHeight: 360,
                    overflowY: "auto", overflowX: "auto",
                    background: dragOver ? "var(--accent-bg)" : "var(--input-bg)",
                    border: `1px solid ${dragOver ? "var(--accent)" : error ? "var(--danger-border)" : "var(--border)"}`,
                    borderRadius: 8,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "0.86em",
                    lineHeight: `${LINE_HEIGHT}px`,
                    position: "relative",
                    boxSizing: "border-box",
                }}
            >
                <div style={{ height: totalHeight, position: "relative" }}>
                    <div style={{
                        position: "absolute",
                        top: startIdx * LINE_HEIGHT,
                        left: 0, right: 0,
                    }}>
                        {visibleLines.map((line, i) => {
                            const lineNum = startIdx + i + 1;
                            return (
                                <div key={lineNum} style={{ display: "flex", height: LINE_HEIGHT }}>
                                    <span style={{
                                        width: 48, flexShrink: 0, textAlign: "right",
                                        paddingRight: 12, color: "var(--text-faint)",
                                        fontSize: "0.79em", userSelect: "none",
                                        borderRight: "1px solid var(--border-faint)",
                                        lineHeight: `${LINE_HEIGHT}px`,
                                    }}>
                                        {lineNum}
                                    </span>
                                    <span style={{
                                        paddingLeft: 12, color: "var(--input-color)",
                                        whiteSpace: "pre", lineHeight: `${LINE_HEIGHT}px`,
                                        flex: 1,
                                    }}>
                                        {line}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Edit button — only in read-only mode */}
            {!forceEdit && (
                <div style={{
                    position: "absolute", top: 10, right: 10,
                    display: "flex", gap: 6, zIndex: 10,
                }}>
                    <span style={{
                        padding: "2px 8px", background: "var(--surface)",
                        border: "1px solid var(--border)", borderRadius: 4,
                        color: "var(--text-faint)", fontSize: "0.72em",
                        fontFamily: "monospace",
                    }}>
                        {lines.length.toLocaleString()} lines · read-only view
                    </span>
                    <button
                        onClick={onEdit}
                        style={{
                            padding: "2px 10px", background: "var(--accent-bg)",
                            border: "1px solid var(--accent)", borderRadius: 4,
                            color: "var(--accent)", cursor: "pointer",
                            fontSize: "0.72em", fontFamily: "monospace",
                        }}
                    >
                        ✎ Edit
                    </button>
                </div>
            )}
        </div>
    );
}