"use client";

import { Settings, THEMES } from "@/theme";

interface Props {
    settings: Settings;
    setSettings: React.Dispatch<React.SetStateAction<Settings>>;
}

export function SettingsPanel({ settings, setSettings }: Props) {
    const btn = (key: keyof Settings, opt: string) => (
        <button
            key={opt}
            onClick={() => setSettings((s) => ({ ...s, [key]: opt }))}
            style={{
                padding: "8px 16px",
                borderRadius: 6,
                cursor: "pointer",
                fontFamily: "monospace",
                fontSize: "0.93em",
                border: "none",
                background: settings[key] === opt ? "var(--accent)" : "var(--surface)",
                color: settings[key] === opt ? "#ffffff" : "var(--text-dim)",
                outline:
                    settings[key] === opt
                        ? "2px solid var(--accent)"
                        : "1px solid var(--border)",
                outlineOffset: settings[key] === opt ? 1 : 0,
                transition: "all 0.15s",
            }}
        >
            {opt}
        </button>
    );

    const toggle = (key: keyof Settings, label: string) => (
        <div key={key} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span
                style={{
                    color: "var(--text-dim)",
                    fontSize: "0.86em",
                    fontFamily: "monospace",
                    minWidth: 200,
                }}
            >
                {label}
            </span>
            <div
                onClick={() =>
                    setSettings((s) => ({ ...s, [key]: !s[key as keyof Settings] }))
                }
                style={{
                    width: 40,
                    height: 22,
                    borderRadius: 11,
                    background: settings[key as keyof Settings]
                        ? "var(--accent)"
                        : "var(--surface)",
                    position: "relative",
                    cursor: "pointer",
                    transition: "background 0.2s",
                    border: "1px solid var(--border)",
                    flexShrink: 0,
                }}
            >
                <div
                    style={{
                        width: 16,
                        height: 16,
                        borderRadius: 8,
                        background: settings[key as keyof Settings]
                            ? "#ffffff"
                            : "var(--text-faint)",
                        position: "absolute",
                        top: 2,
                        left: settings[key as keyof Settings] ? 20 : 2,
                        transition: "left 0.2s",
                    }}
                />
            </div>
            <span
                style={{
                    color: settings[key as keyof Settings]
                        ? "var(--accent)"
                        : "var(--text-faint)",
                    fontSize: "0.79em",
                    fontFamily: "monospace",
                }}
            >
                {settings[key as keyof Settings] ? "On" : "Off"}
            </span>
        </div>
    );

    const section = (label: string, children: React.ReactNode) => (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div
                style={{
                    color: "var(--text-faint)",
                    fontSize: "0.72em",
                    letterSpacing: 1.5,
                    fontFamily: "monospace",
                    fontWeight: 600,
                }}
            >
                {label}
            </div>
            {children}
        </div>
    );

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 28, maxWidth: 520 }}>
            {section(
                "THEME",
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {Object.keys(THEMES).map((t) => btn("theme", t))}
                </div>
            )}

            {section(
                "FONT SIZE",
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {["12px", "13px", "14px", "15px", "16px"].map((t) => btn("fontSize", t))}
                </div>
            )}

            {section(
                "AUTO-COLLAPSE DEPTH",
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {["1", "2", "3", "All"].map((t) => btn("collapseDepth", t))}
                </div>
            )}

            {section(
                "TOGGLES",
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {toggle("lineNumbers", "Line numbers in results")}
                    {toggle("wordWrap", "Word wrap in results")}
                    {toggle("typeHints", "Type hints in tree")}
                </div>
            )}

            {/* Live preview */}
            {section(
                "LIVE PREVIEW",
                <div
                    style={{
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        padding: "14px 18px",
                    }}
                >
                    <div
                        style={{
                            fontFamily: "monospace",
                            fontSize: settings.fontSize,
                            lineHeight: 1.8,
                        }}
                    >
                        <div>
                            <span style={{ color: "var(--node-key)" }}>orderId</span>
                            <span style={{ color: "var(--text-faint)" }}>: </span>
                            <span style={{ color: "var(--node-str)" }}>&quot;ORD1001&quot;</span>
                        </div>
                        <div>
                            <span style={{ color: "var(--node-key)" }}>total</span>
                            <span style={{ color: "var(--text-faint)" }}>: </span>
                            <span style={{ color: "var(--node-num)" }}>87500</span>
                        </div>
                        <div>
                            <span style={{ color: "var(--node-key)" }}>active</span>
                            <span style={{ color: "var(--text-faint)" }}>: </span>
                            <span style={{ color: "var(--node-bool)" }}>true</span>
                        </div>
                        <div>
                            <span style={{ color: "var(--node-key)" }}>status</span>
                            <span style={{ color: "var(--text-faint)" }}>: </span>
                            <span style={{ color: "var(--node-null)" }}>null</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}