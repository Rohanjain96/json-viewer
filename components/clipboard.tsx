"use client";
import { useEffect, useRef, useState } from "react";
import { registerCopyModal } from "@/components/tree-node";

// ─── HELPERS ─────────────────────────────────────────────────────────────────
export function execCommandCopy(text: string): boolean {
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
        navigator.clipboard.writeText(text).catch(() => execCommandCopy(text));
        return;
    }
    execCommandCopy(text);
}

// ─── COPY MODAL ───────────────────────────────────────────────────────────────
function CopyModal({ text, onClose }: { text: string; onClose: () => void }) {
    const taRef = useRef<HTMLTextAreaElement>(null);
    useEffect(() => {
        if (taRef.current) {
            taRef.current.focus();
            taRef.current.select();
            try { document.execCommand("copy"); } catch { }
        }
    }, []);

    return (
        <div
            onClick={onClose}
            style={{ position: "fixed", inset: 0, background: "var(--overlay)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 24, width: "100%", maxWidth: 520, boxShadow: "0 16px 48px #000a" }}
            >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <span style={{ color: "var(--text-dim)", fontFamily: "monospace", fontSize: "0.93em" }}>
                        Press Ctrl+C / ⌘C to copy
                    </span>
                    <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-dim)", cursor: "pointer", fontSize: "1.57em", lineHeight: 1 }}>×</button>
                </div>
                <textarea
                    aria-label="Text to copy"
                    ref={taRef}
                    readOnly
                    value={text}
                    style={{ width: "100%", minHeight: 100, maxHeight: 300, background: "var(--input-bg)", border: "1px solid var(--border)", borderRadius: 8, padding: 12, color: "var(--input-color)", fontFamily: "monospace", fontSize: "0.93em", lineHeight: 1.6, resize: "vertical", outline: "none", boxSizing: "border-box" }}
                    onFocus={e => e.target.select()}
                    onClick={e => (e.target as HTMLTextAreaElement).select()}
                />
                <div style={{ marginTop: 10, color: "var(--text-faint)", fontSize: "0.79em", fontFamily: "monospace", textAlign: "center" }}>
                    Text is selected — press Ctrl+C (Win/Linux) or ⌘C (Mac)
                </div>
            </div>
        </div>
    );
}

export function useCopyModal() {
    const [modalText, setModalText] = useState<string | null>(null);
    useEffect(() => {
        registerCopyModal(setModalText);
        return () => registerCopyModal(() => { });
    }, []);
    return modalText
        ? <CopyModal text={modalText} onClose={() => setModalText(null)} />
        : null;
}