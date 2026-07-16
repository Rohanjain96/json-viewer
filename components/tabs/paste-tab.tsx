"use client";
import { useRef, useState } from "react";
import { useBreakpoint } from "@/hooks/use-breakpoints";
import { ApplyHistoryEntry, JSONValue } from "@/types/json";
import MOCK_JSON from "@/data/mock-data.json";
import { parseAsync } from "@/utils/parse-async";
import { stringifyAsync } from "@/utils/copy-async";
import { formatSize } from "@/utils/format-size";
import { VirtualTextView } from "../virtual-text-view";

interface Props {
    onApply: (data: JSONValue) => void;
    getPasteText: () => string;
    setPasteText: (text: string) => void;
    history: ApplyHistoryEntry[];
    onRestore: (entry: ApplyHistoryEntry) => void;
}

const LARGE_THRESHOLD = 50_000;

function yieldToBrowser(): Promise<void> {
    return new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 0)));
}

function sizeLabel(text: string) {
    return formatSize(new Blob([text]).size);
}

function HistoryButton({ history, onRestore }: { history: ApplyHistoryEntry[]; onRestore: (entry: ApplyHistoryEntry) => void }) {
    const [open, setOpen] = useState(false);
    if (history.length === 0) return null;

    return (
        <div style={{ position: "relative" }}>
            <button
                onClick={() => setOpen(o => !o)}
                onBlur={() => setTimeout(() => setOpen(false), 150)}
                style={{
                    padding: "9px 15px", borderRadius: "var(--radius-md)", cursor: "pointer",
                    fontSize: "0.85em", fontWeight: 500, border: `1px solid ${open ? "var(--accent-border)" : "var(--border)"}`,
                    background: open ? "var(--accent-bg)" : "var(--surface)", color: open ? "var(--accent)" : "var(--text-dim)",
                    transition: "all 0.15s var(--ease-out)", display: "flex", alignItems: "center", gap: 6,
                }}>
                History
                <span className="mono" style={{ fontSize: "0.86em", color: "var(--text-faint)", background: "var(--panel)", border: "1px solid var(--border-faint)", borderRadius: "var(--radius-full)", padding: "0 6px" }}>
                    {history.length}
                </span>
            </button>

            {open && (
                <div className="card" style={{ position: "absolute", top: "100%", right: 0, marginTop: 6, width: 280, zIndex: 300, boxShadow: "var(--shadow-md)", overflow: "hidden", animation: "fadeSlideUp 0.12s var(--ease-out)" }}>
                    <div style={{ padding: "8px 12px 6px", color: "var(--text-faint)", fontSize: "0.68em", letterSpacing: 1, fontWeight: 600 }}>
                        PAST APPLIES · CLICK TO RESTORE
                    </div>
                    {history.map((h, i) => (
                        <div key={h.timestamp}
                            onMouseDown={() => onRestore(h)}
                            style={{ padding: "8px 12px", cursor: "pointer", borderTop: "1px solid var(--border-faint)", display: "flex", flexDirection: "column", gap: 2 }}
                            onMouseEnter={e => (e.currentTarget.style.background = "var(--surface)")}
                            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                            <span style={{ fontSize: "0.82em", color: "var(--text)" }}>{h.label}</span>
                            <span className="mono" style={{ fontSize: "0.7em", color: "var(--text-faint)" }}>
                                {new Date(h.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                                {i === 0 ? " · most recent" : ""}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export function PasteTab({ onApply, getPasteText, setPasteText, history, onRestore }: Props) {
    const { isMobile } = useBreakpoint();
    const textRef = useRef(getPasteText());
    const [textVersion, setTextVersion] = useState(0);
    const [isLarge, setIsLarge] = useState(() => textRef.current.length > LARGE_THRESHOLD);
    const [forceEdit, setForceEdit] = useState(false);
    const [charCount, setCharCount] = useState(() => textRef.current.length);
    const [fileSizeLabel, setFileSizeLabel] = useState(() => sizeLabel(textRef.current));
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fileName, setFileName] = useState("");
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const updateMeta = (text: string) => {
        const large = text.length > LARGE_THRESHOLD;
        setIsLarge(large);
        if (!large) setForceEdit(false);
        setCharCount(text.length);
        setFileSizeLabel(sizeLabel(text));
    };

    const setText = (text: string) => {
        textRef.current = text;
        setPasteText(text);
        updateMeta(text);
    };

    const replaceText = (text: string) => {
        textRef.current = text;
        setPasteText(text);
        updateMeta(text);
        setTextVersion(v => v + 1);
    };

    const handleApply = async () => {
        const text = textRef.current;
        if (!text.trim()) return;
        setLoading(true);
        setError("");
        await yieldToBrowser();
        try {
            const parsed = await parseAsync(text) as JSONValue;
            setError("");
            setSuccess(true);
            setTimeout(() => setSuccess(false), 2000);
            onApply(parsed);
        } catch (e) {
            setError(`Invalid JSON: ${e instanceof Error ? e.message : "Parse error"}`);
        } finally {
            setLoading(false);
        }
    };

    const handleLoad = async (sample: JSONValue) => {
        setLoading(true);
        setFileName("");
        setError("");
        await yieldToBrowser();
        const str = await stringifyAsync(sample, 2);
        replaceText(str);
        setLoading(false);
    };

    const loadFileText = (file: File | undefined) => {
        if (!file) return;
        if (!file.name.endsWith(".json") && file.type !== "application/json") {
            setError("Please select a .json file");
            return;
        }
        setLoading(true);
        setError("");
        const reader = new FileReader();
        reader.onload = async (e) => {
            const text = e.target?.result;
            if (typeof text !== "string") { setError("Failed to read file"); setLoading(false); return; }
            replaceText(text);
            setFileName(file.name);
            try {
                await parseAsync(text);
                setError("");
            } catch (err) {
                setError(`File contains invalid JSON: ${err instanceof Error ? err.message : "Invalid JSON"}`);
            } finally {
                setLoading(false);
            }
        };
        reader.onerror = () => { setError("Failed to read file"); setLoading(false); };
        reader.readAsText(file);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => loadFileText(e.target.files?.[0]);

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragOver(false);
        loadFileText(e.dataTransfer.files?.[0]);
    };

    const handlePasteBlur = async (text: string) => {
        setFileName("");
        setError("");
        const isHeavy = text.length > LARGE_THRESHOLD || charCount > LARGE_THRESHOLD;
        if (!isHeavy) { setText(text); return; }
        setLoading(true);
        await yieldToBrowser();
        setText(text);
        setLoading(false);
    };

    const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        const pasted = e.clipboardData.getData("text");
        const el = e.currentTarget;
        const selLen = el.selectionEnd - el.selectionStart;
        const prospectiveLen = el.value.length - selLen + pasted.length;
        if (prospectiveLen <= LARGE_THRESHOLD && charCount <= LARGE_THRESHOLD) return;
        e.preventDefault();
        setFileName("");
        setError("");
        setLoading(true);
        await yieldToBrowser();
        const start = el.selectionStart;
        const end = el.selectionEnd;
        const next = el.value.slice(0, start) + pasted + el.value.slice(end);
        setText(next);
        if (document.body.contains(el)) {
            el.value = next;
            const caret = start + pasted.length;
            el.selectionStart = el.selectionEnd = caret;
        }
        setLoading(false);
    };

    const btnBase: React.CSSProperties = {
        borderRadius: "var(--radius-md)", cursor: "pointer",
        fontSize: "0.85em", fontWeight: 500, border: "1px solid var(--border)",
        background: "var(--surface)", color: "var(--text-dim)",
        padding: "9px 15px", transition: "all 0.15s var(--ease-out)",
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 14, height: "100%" }}>
            <input ref={fileInputRef} type="file" accept=".json,application/json" aria-label="Upload JSON file" onChange={handleFileChange} style={{ display: "none" }} />

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <button onClick={handleApply} disabled={loading || charCount === 0}
                    style={{
                        ...btnBase, padding: "9px 22px",
                        background: success ? "var(--success-bg)" : loading ? "var(--surface)" : "var(--accent-strong)",
                        border: success ? "1px solid var(--success-border)" : "none",
                        color: success ? "var(--success)" : loading ? "var(--text-faint)" : "#ffffff",
                        fontWeight: 600, opacity: loading || charCount === 0 ? 0.6 : 1,
                        cursor: loading || charCount === 0 ? "not-allowed" : "pointer",
                        display: "flex", alignItems: "center", gap: 6, minWidth: 130,
                        boxShadow: !loading && !success && charCount > 0 ? "var(--shadow-button)" : "none",
                    }}
                    onMouseEnter={e => { if (!loading && !success && charCount > 0) e.currentTarget.style.background = "var(--accent)"; }}
                    onMouseLeave={e => { if (!loading && !success && charCount > 0) e.currentTarget.style.background = "var(--accent-strong)"; }}>
                    {loading ? (
                        <>
                            <span style={{ display: "inline-block", width: 12, height: 12, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
                            Parsing…
                        </>
                    ) : success ? "✓ Applied!" : "Apply JSON →"}
                </button>

                <button onClick={() => { if (fileInputRef.current) { fileInputRef.current.value = ""; fileInputRef.current.click(); } }} disabled={loading}
                    style={{ ...btnBase, display: "flex", alignItems: "center", gap: 6, opacity: loading ? 0.5 : 1, cursor: loading ? "not-allowed" : "pointer" }}
                    onMouseEnter={e => { if (!loading) { e.currentTarget.style.borderColor = "var(--border-strong)"; e.currentTarget.style.color = "var(--text)"; } }}
                    onMouseLeave={e => { if (!loading) { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-dim)"; } }}>
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                        <path d="M2 11v2a1 1 0 001 1h10a1 1 0 001-1v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        <path d="M8 2v8M5 5l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Import File
                </button>

                <button onClick={() => handleLoad(MOCK_JSON as JSONValue)} disabled={loading} style={{ ...btnBase, opacity: loading ? 0.5 : 1 }}
                    onMouseEnter={e => { if (!loading) e.currentTarget.style.borderColor = "var(--border-strong)"; }}
                    onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}>
                    Load Demo
                </button>

                <button onClick={() => { replaceText(""); setFileName(""); setError(""); }} disabled={loading}
                    style={{ ...btnBase, color: "var(--text-faint)", opacity: loading ? 0.5 : 1 }}>
                    Clear
                </button>

                <HistoryButton history={history} onRestore={onRestore} />

                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
                    {fileName && (
                        <span className="mono" style={{ color: "var(--tag-color)", fontSize: "0.76em", background: "var(--tag-bg)", border: "1px solid var(--tag-border)", borderRadius: "var(--radius-sm)", padding: "3px 9px", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            📄 {fileName}
                        </span>
                    )}
                    {charCount > 0 && (
                        <span className="mono" style={{ color: "var(--text-faint)", fontSize: "0.76em" }}>
                            {charCount.toLocaleString()} chars · {fileSizeLabel}
                        </span>
                    )}
                </div>
            </div>

            {loading && (
                <div style={{ height: 2, background: "var(--border-faint)", borderRadius: 1, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: "40%", background: "var(--accent)", borderRadius: 1, animation: "slideProgress 1s ease-in-out infinite alternate" }} />
                </div>
            )}

            {error && (
                <div className="mono" style={{ background: "var(--danger)", border: "1px solid var(--danger-border)", borderRadius: "var(--radius-md)", padding: "9px 13px", color: "var(--btn-danger)", fontSize: "0.85em" }}>
                    ⚠ {error}
                </div>
            )}

            <div onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop}
                style={{ flex: 1, position: "relative", minHeight: isMobile ? 260 : 360 }}>
                {isLarge ? (
                    <VirtualTextView
                        key={textVersion}
                        text={textRef.current}
                        onEdit={() => setForceEdit(true)}
                        onDoneEdit={() => setForceEdit(false)}
                        forceEdit={forceEdit}
                        onChange={async (t) => { setFileName(""); setError(""); setLoading(true); await yieldToBrowser(); setText(t); setLoading(false); }}
                        dragOver={dragOver}
                        error={error}
                        loading={loading}
                    />
                ) : (
                    <textarea
                        key={textVersion}
                        defaultValue={textRef.current}
                        onPaste={handlePaste}
                        onBlur={e => handlePasteBlur(e.target.value)}
                        placeholder={"Paste your JSON here, or drag & drop a .json file...\n\nExample:\n{\n  \"name\": \"Alice\",\n  \"age\": 30\n}"}
                        spellCheck={false}
                        disabled={loading}
                        className="mono"
                        style={{
                            width: "100%", height: "100%", minHeight: isMobile ? 260 : 360,
                            background: dragOver ? "var(--accent-bg)" : "var(--input-bg)",
                            border: `1.5px solid ${dragOver ? "var(--accent)" : error ? "var(--danger-border)" : "var(--border)"}`,
                            borderRadius: "var(--radius-md)", padding: 17,
                            color: "var(--input-color)", fontSize: "0.92em", lineHeight: 1.7,
                            outline: "none", resize: "vertical",
                            transition: "border-color 0.15s var(--ease-out), background 0.15s var(--ease-out), box-shadow 0.15s var(--ease-out)",
                            boxShadow: dragOver ? "0 0 0 3px var(--accent-bg)" : "none",
                            opacity: loading ? 0.6 : 1, boxSizing: "border-box",
                        }}
                        onFocus={e => { if (!dragOver) e.currentTarget.style.boxShadow = "0 0 0 3px var(--accent-bg)"; }}
                    />
                )}

                {dragOver && (
                    <div style={{ position: "absolute", inset: 0, borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--overlay)", pointerEvents: "none", border: "2px dashed var(--accent)" }}>
                        <div style={{ textAlign: "center", color: "var(--text)", fontSize: "0.94em" }}>
                            <div style={{ fontSize: "2em", marginBottom: 8 }}>⬆</div>
                            Drop .json file here
                        </div>
                    </div>
                )}

                {loading && (
                    <div style={{ position: "absolute", inset: 0, borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--overlay)", pointerEvents: "none", flexDirection: "column", gap: 10 }}>
                        <div style={{ width: 28, height: 28, border: "3px solid var(--border)", borderTop: "3px solid var(--accent)", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                        <span style={{ color: "var(--text-dim)", fontSize: "0.88em" }}>Parsing JSON…</span>
                    </div>
                )}
            </div>

            <style>{`@keyframes slideProgress { from { transform: translateX(-100%); } to { transform: translateX(350%); } }`}</style>

            <div style={{ color: "var(--text-faint)", fontSize: "0.76em" }}>
                Tip: Click ✎ Edit to modify · ✓ Done to save · then Apply JSON →
            </div>
        </div>
    );
}