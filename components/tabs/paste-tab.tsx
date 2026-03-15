"use client";
import { useRef, useState } from "react";
import { useBreakpoint } from "@/hooks/use-breakpoints";
import { JSONValue } from "@/types/json";
import MOCK_JSON from "@/data/mock-data.json";

interface Props {
    jsonText: string;
    setJsonText: (text: string) => void;
    onApply: (data: JSONValue) => void;
}

export function PasteTab({ jsonText, setJsonText, onApply }: Props) {
    const { isMobile } = useBreakpoint();
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [fileName, setFileName] = useState("");
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const handleApply = () => {
        try {
            const parsed = JSON.parse(jsonText);
            setError("");
            setSuccess(true);
            setTimeout(() => setSuccess(false), 2000);
            setTimeout(() => onApply(parsed), 0);
        } catch (e) {
            const message = e instanceof Error ? e.message : "Invalid JSON";
            setError(`Invalid JSON: ${message}`);
        }
    };

    const handleLoad = (sample: JSONValue) => {
        setJsonText(JSON.stringify(sample, null, 2));
        setFileName("");
        setError("");
    };

    const loadFileText = (file: File | undefined) => {
        if (!file) return;
        if (!file.name.endsWith(".json") && file.type !== "application/json") {
            setError("Please select a .json file");
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result;
            if (typeof text !== "string") { setError("Failed to read file"); return; }
            setJsonText(text);
            setFileName(file.name);
            setError("");
            try { JSON.parse(text); }
            catch (err) {
                setError(`File contains invalid JSON: ${err instanceof Error ? err.message : "Invalid JSON"}`);
            }
        };
        reader.onerror = () => setError("Failed to read file");
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

    const btnBase: React.CSSProperties = {
        borderRadius: 6, cursor: "pointer", fontFamily: "monospace",
        fontSize: "0.86em", border: "1px solid var(--border)",
        background: "var(--surface)", color: "var(--text-dim)",
        padding: "8px 14px", transition: "all 0.15s",
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 14, height: "100%" }}>
            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                aria-label="Upload JSON file"
                onChange={handleFileChange}
                style={{ display: "none" }}
            />

            {/* Toolbar */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <button
                    onClick={handleApply}
                    style={{
                        ...btnBase,
                        padding: "8px 20px",
                        background: success ? "var(--success-bg)" : "var(--accent)",
                        border: success ? "1px solid var(--success-border)" : "none",
                        color: success ? "var(--success)" : "#ffffff",
                        fontWeight: 600,
                    }}
                >
                    {success ? "✓ Applied!" : "Apply JSON →"}
                </button>

                <button
                    onClick={() => { if (fileInputRef.current) { fileInputRef.current.value = ""; fileInputRef.current.click(); } }}
                    style={{ ...btnBase, display: "flex", alignItems: "center", gap: 6 }}
                >
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                        <path d="M2 11v2a1 1 0 001 1h10a1 1 0 001-1v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        <path d="M8 2v8M5 5l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Import File
                </button>

                <button onClick={() => handleLoad(MOCK_JSON as JSONValue)} style={btnBase}>
                    Load Demo
                </button>

                <button
                    onClick={() => { setJsonText(""); setFileName(""); setError(""); }}
                    style={{ ...btnBase, color: "var(--text-faint)" }}
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
                    {jsonText.length > 0 && (
                        <span style={{ color: "var(--text-faint)", fontSize: "0.72em", fontFamily: "monospace" }}>
                            {jsonText.length.toLocaleString()} chars
                        </span>
                    )}
                </div>
            </div>

            {/* Error */}
            {error && (
                <div style={{
                    background: "var(--danger)", border: "1px solid var(--danger-border)",
                    borderRadius: 6, padding: "8px 12px", color: "var(--btn-danger)",
                    fontSize: "0.86em", fontFamily: "monospace",
                }}>
                    ⚠ {error}
                </div>
            )}

            {/* Textarea with drag-and-drop */}
            <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                style={{ flex: 1, position: "relative" }}
            >
                <textarea
                    value={jsonText}
                    onChange={(e) => { setJsonText(e.target.value); setFileName(""); setError(""); }}
                    placeholder={"Paste your JSON here, or drag & drop a .json file...\n\nExample:\n{\n  \"name\": \"Alice\",\n  \"age\": 30\n}"}
                    spellCheck={false}
                    style={{
                        width: "100%", height: "100%",
                        minHeight: isMobile ? 260 : 360,
                        background: dragOver ? "var(--accent-bg)" : "var(--input-bg)",
                        border: `1px solid ${dragOver ? "var(--accent)" : "var(--border)"}`,
                        borderRadius: 8, padding: 16,
                        color: "var(--input-color)",
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "0.93em", lineHeight: 1.7,
                        outline: "none", resize: "vertical",
                        transition: "border-color 0.15s, background 0.15s",
                    }}
                />
                {dragOver && (
                    <div style={{
                        position: "absolute", inset: 0, borderRadius: 8,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: "var(--overlay)", pointerEvents: "none",
                        border: "2px dashed var(--accent)",
                    }}>
                        <div style={{ textAlign: "center", color: "var(--text)", fontFamily: "monospace", fontSize: "0.93em" }}>
                            <div style={{ fontSize: "2em", marginBottom: 8 }}>⬆</div>
                            Drop .json file here
                        </div>
                    </div>
                )}
            </div>

            <div style={{ color: "var(--text-faint)", fontSize: "0.72em", fontFamily: "monospace" }}>
                Tip: Press Apply JSON → then switch to Explorer to browse the tree
            </div>
        </div>
    );
}