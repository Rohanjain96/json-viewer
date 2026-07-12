"use client";
import { Settings, THEMES } from "@/theme";

interface Props {
    settings: Settings;
    setSettings: React.Dispatch<React.SetStateAction<Settings>>;
}

export function SettingsPanel({ settings, setSettings }: Props) {
    const btn = (key: keyof Settings, opt: string) => (
        <button key={opt} onClick={() => setSettings((s) => ({ ...s, [key]: opt }))}
            style={{
                padding: "7px 15px", borderRadius: "var(--radius-md)", cursor: "pointer",
                fontSize: "0.89em", fontWeight: settings[key] === opt ? 600 : 500,
                border: `1px solid ${settings[key] === opt ? "var(--accent-border)" : "var(--border)"}`,
                background: settings[key] === opt ? "var(--accent-bg)" : "var(--surface)",
                color: settings[key] === opt ? "var(--accent)" : "var(--text-dim)",
                transition: "all 0.15s var(--ease-out)",
            }}
            onMouseEnter={e => { if (settings[key] !== opt) { e.currentTarget.style.borderColor = "var(--border-strong)"; e.currentTarget.style.color = "var(--text)"; } }}
            onMouseLeave={e => { if (settings[key] !== opt) { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-dim)"; } }}>
            {opt}
        </button>
    );

    const toggle = (key: keyof Settings, label: string) => (
        <div key={key} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ color: "var(--text-dim)", fontSize: "0.88em", minWidth: 200 }}>{label}</span>
            <div onClick={() => setSettings((s) => ({ ...s, [key]: !s[key as keyof Settings] }))}
                style={{
                    width: 38, height: 21, borderRadius: "var(--radius-full)",
                    background: settings[key as keyof Settings] ? "var(--accent-strong)" : "var(--surface)",
                    position: "relative", cursor: "pointer", transition: "background 0.2s var(--ease-out)",
                    border: `1px solid ${settings[key as keyof Settings] ? "var(--accent-strong)" : "var(--border)"}`, flexShrink: 0,
                }}>
                <div style={{
                    width: 15, height: 15, borderRadius: "50%",
                    background: settings[key as keyof Settings] ? "#ffffff" : "var(--text-faint)",
                    position: "absolute", top: 2, left: settings[key as keyof Settings] ? 19 : 2,
                    transition: "left 0.2s var(--ease-out)",
                }} />
            </div>
            <span style={{ color: settings[key as keyof Settings] ? "var(--accent)" : "var(--text-faint)", fontSize: "0.8em", fontWeight: 500 }}>
                {settings[key as keyof Settings] ? "On" : "Off"}
            </span>
        </div>
    );

    const section = (label: string, children: React.ReactNode) => (
        <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            <div style={{ color: "var(--text)", fontSize: "0.74em", letterSpacing: 0.6, fontWeight: 600, textTransform: "uppercase" }}>{label}</div>
            {children}
        </div>
    );

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 30, maxWidth: 520 }}>
            {section("Theme", <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{Object.keys(THEMES).map((t) => btn("theme", t))}</div>)}
            {section("Font Size", <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{["12px", "13px", "14px", "15px", "16px"].map((t) => btn("fontSize", t))}</div>)}
            {section("Auto-Collapse Depth", <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{["1", "2", "3", "All"].map((t) => btn("collapseDepth", t))}</div>)}
            {section("Toggles", <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                {toggle("lineNumbers", "Line numbers in results")}
                {toggle("wordWrap", "Word wrap in results")}
                {toggle("typeHints", "Type hints in tree")}
            </div>)}

            {section("Live Preview", (
                <div className="card" style={{ padding: "15px 19px" }}>
                    <div className="mono" style={{ fontSize: settings.fontSize, lineHeight: 1.85 }}>
                        <div><span style={{ color: "var(--node-key)" }}>orderId</span><span style={{ color: "var(--text-faint)" }}>: </span><span style={{ color: "var(--node-str)" }}>&quot;ORD1001&quot;</span></div>
                        <div><span style={{ color: "var(--node-key)" }}>total</span><span style={{ color: "var(--text-faint)" }}>: </span><span style={{ color: "var(--node-num)" }}>87500</span></div>
                        <div><span style={{ color: "var(--node-key)" }}>active</span><span style={{ color: "var(--text-faint)" }}>: </span><span style={{ color: "var(--node-bool)" }}>true</span></div>
                        <div><span style={{ color: "var(--node-key)" }}>status</span><span style={{ color: "var(--text-faint)" }}>: </span><span style={{ color: "var(--node-null)" }}>null</span></div>
                    </div>
                </div>
            ))}
        </div>
    );
}