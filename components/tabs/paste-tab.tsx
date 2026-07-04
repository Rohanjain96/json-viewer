"use client";
import { useRef, useState } from "react";
import { useBreakpoint } from "@/hooks/use-breakpoints";
import { JSONValue } from "@/types/json";
import MOCK_JSON from "@/data/mock-data.json";
import { parseAsync } from "@/utils/parse-async";
import { stringifyAsync } from "@/utils/copy-async";
import { VirtualTextView } from "../virtual-text-view";

interface Props {
    onApply: (data: JSONValue) => void;
    getPasteText: () => string;
    setPasteText: (text: string) => void;
}

const LARGE_THRESHOLD = 50_000;

function yieldToBrowser(): Promise<void> {
    return new Promise(resolve =>
        requestAnimationFrame(() => setTimeout(resolve, 0))
    );
}

function sizeLabel(text: string) {
    const bytes = new Blob([text]).size;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function PasteTab({ onApply, getPasteText, setPasteText }: Props) {
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

    // Wholesale replacement (demo data, file load, clear). Bumps textVersion
    // so the uncontrolled input remounts and shows the new defaultValue.
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
            onApply(parsed); // bumps jsonVersion in App — text itself is untouched
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
            if (typeof text !== "string") {
                setError("Failed to read file");
                setLoading(false);
                return;
            }
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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        loadFileText(e.target.files?.[0]);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragOver(false);
        loadFileText(e.dataTransfer.files?.[0]);
    };

    const handlePasteBlur = async (text: string) => {
        setFileName("");
        setError("");

        const isHeavy = text.length > LARGE_THRESHOLD || charCount > LARGE_THRESHOLD;
        if (!isHeavy) {
            setText(text);
            return;
        }

        setLoading(true);
        await yieldToBrowser(); // let the spinner actually paint before the heavy work
        setText(text);
        setLoading(false);
    };

    const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        const pasted = e.clipboardData.getData("text");
        const el = e.currentTarget;
        const selLen = el.selectionEnd - el.selectionStart;
        const prospectiveLen = el.value.length - selLen + pasted.length;

        // Small paste: let the browser handle it natively, instantly.
        // No lag, no need for a spinner.
        if (prospectiveLen <= LARGE_THRESHOLD && charCount <= LARGE_THRESHOLD) {
            return;
        }

        // Large paste: take over entirely.
        e.preventDefault();
        setFileName("");
        setError("");
        setLoading(true);
        await yieldToBrowser(); // let the spinner actually paint first

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
        borderRadius: 6, cursor: "pointer", fontFamily: "monospace",
        fontSize: "0.86em", border: "1px solid var(--border)",
        background: "var(--surface)", color: "var(--text-dim)",
        padding: "8px 14px", transition: "all 0.15s",
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 14, height: "100%" }}>
            <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                aria-label="Upload JSON file"
                onChange={handleFileChange}
                style={{ display: "none" }}
            />

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <button
                    onClick={handleApply}
                    disabled={loading || charCount === 0}
                    style={{
                        ...btnBase,
                        padding: "8px 20px",
                        background: success ? "var(--success-bg)" : loading ? "var(--surface)" : "var(--accent)",
                        border: success ? "1px solid var(--success-border)" : "none",
                        color: success ? "var(--success)" : loading ? "var(--text-faint)" : "#ffffff",
                        fontWeight: 600,
                        opacity: loading || charCount === 0 ? 0.7 : 1,
                        cursor: loading || charCount === 0 ? "not-allowed" : "pointer",
                        display: "flex", alignItems: "center", gap: 6,
                        minWidth: 130,
                    }}
                >
                    {loading ? (
                        <>
                            <span style={{ display: "inline-block", width: 12, height: 12, border: "2px solid var(--border)", borderTop: "2px solid var(--accent)", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
                            Parsing…
                        </>
                    ) : success ? "✓ Applied!" : "Apply JSON →"}
                </button>

                <button
                    onClick={() => { if (fileInputRef.current) { fileInputRef.current.value = ""; fileInputRef.current.click(); } }}
                    disabled={loading}
                    style={{ ...btnBase, display: "flex", alignItems: "center", gap: 6, opacity: loading ? 0.5 : 1, cursor: loading ? "not-allowed" : "pointer" }}
                >
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                        <path d="M2 11v2a1 1 0 001 1h10a1 1 0 001-1v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        <path d="M8 2v8M5 5l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Import File
                </button>

                <button onClick={() => handleLoad(MOCK_JSON as JSONValue)} disabled={loading} style={{ ...btnBase, opacity: loading ? 0.5 : 1 }}>
                    Load Demo
                </button>

                <button
                    onClick={() => { replaceText(""); setFileName(""); setError(""); }}
                    disabled={loading}
                    style={{ ...btnBase, color: "var(--text-faint)", opacity: loading ? 0.5 : 1 }}
                >
                    Clear
                </button>

                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
                    {fileName && (
                        <span style={{
                            color: "var(--tag-color)", fontSize: "0.72em", fontFamily: "monospace",
                            background: "var(--tag-bg)", border: "1px solid var(--tag-border)",
                            borderRadius: 4, padding: "2px 8px", maxWidth: 160,
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                            📄 {fileName}
                        </span>
                    )}
                    {charCount > 0 && (
                        <span style={{ color: "var(--text-faint)", fontSize: "0.72em", fontFamily: "monospace" }}>
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
                <div style={{ background: "var(--danger)", border: "1px solid var(--danger-border)", borderRadius: 6, padding: "8px 12px", color: "var(--btn-danger)", fontSize: "0.86em", fontFamily: "monospace" }}>
                    ⚠ {error}
                </div>
            )}

            <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                style={{ flex: 1, position: "relative", minHeight: isMobile ? 260 : 360 }}
            >
                {isLarge ? (
                    <VirtualTextView
                        key={textVersion}
                        text={textRef.current}
                        onEdit={() => setForceEdit(true)}
                        onDoneEdit={() => setForceEdit(false)}
                        forceEdit={forceEdit}
                        onChange={async (t) => {
                            setFileName("");
                            setError("");
                            setLoading(true);
                            await yieldToBrowser();
                            setText(t);
                            setLoading(false);
                        }}
                        dragOver={dragOver}
                        error={error}
                        loading={loading}
                    />
                ) : (
                    <textarea
                        key={textVersion}
                        defaultValue={textRef.current}
                        onPaste={handlePaste}
                        onBlur={e => { handlePasteBlur(e.target.value) }}
                        placeholder={"Paste your JSON here, or drag & drop a .json file...\n\nExample:\n{\n  \"name\": \"Alice\",\n  \"age\": 30\n}"}
                        spellCheck={false}
                        disabled={loading}
                        style={{
                            width: "100%", height: "100%",
                            minHeight: isMobile ? 260 : 360,
                            background: dragOver ? "var(--accent-bg)" : "var(--input-bg)",
                            border: `1px solid ${dragOver ? "var(--accent)" : error ? "var(--danger-border)" : "var(--border)"}`,
                            borderRadius: 8, padding: 16,
                            color: "var(--input-color)",
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: "0.93em", lineHeight: 1.7,
                            outline: "none", resize: "vertical",
                            transition: "border-color 0.15s, background 0.15s",
                            opacity: loading ? 0.6 : 1,
                            boxSizing: "border-box",
                        }}
                    />
                )}

                {dragOver && (
                    <div style={{ position: "absolute", inset: 0, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--overlay)", pointerEvents: "none", border: "2px dashed var(--accent)" }}>
                        <div style={{ textAlign: "center", color: "var(--text)", fontFamily: "monospace", fontSize: "0.93em" }}>
                            <div style={{ fontSize: "2em", marginBottom: 8 }}>⬆</div>
                            Drop .json file here
                        </div>
                    </div>
                )}

                {loading && (
                    <div style={{ position: "absolute", inset: 0, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--overlay)", pointerEvents: "none", flexDirection: "column", gap: 10 }}>
                        <div style={{ width: 28, height: 28, border: "3px solid var(--border)", borderTop: "3px solid var(--accent)", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                        <span style={{ color: "var(--text-dim)", fontFamily: "monospace", fontSize: "0.86em" }}>Parsing JSON…</span>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes slideProgress {
                    from { transform: translateX(-100%); }
                    to   { transform: translateX(350%); }
                }
            `}</style>

            <div style={{ color: "var(--text-faint)", fontSize: "0.72em", fontFamily: "monospace" }}>
                Tip: Click ✎ Edit to modify · ✓ Done to save · then Apply JSON →
            </div>
        </div>
    );
}