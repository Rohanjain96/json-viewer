"use client";

interface Tab {
    id: string;
    label: string;
    icon: string;
}

interface Props {
    tabs: Tab[];
    activeTab: string;
    isMobile: boolean;
    pad: number;
    onSwitchTab: (id: string) => void;
}

export function TopBar({ tabs, activeTab, isMobile, pad, onSwitchTab }: Props) {
    return (
        <div style={{ background: "var(--panel)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", height: 52, flexShrink: 0, overflow: "hidden" }}>
            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: `0 ${pad}px`, borderRight: !isMobile ? "1px solid var(--border)" : "none", height: "100%", flexShrink: 0 }}>
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ flexShrink: 0 }}>
                    <rect width="28" height="28" rx="7" fill="url(#lg)" />
                    <defs>
                        <linearGradient id="lg" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#5566ff" />
                            <stop offset="1" stopColor="#aa44ff" />
                        </linearGradient>
                    </defs>
                    <text x="5" y="20" fontFamily="monospace" fontWeight="800" fontSize="16" fill="white">{"{ }"}</text>
                </svg>
                <span style={{ color: "var(--text)", fontSize: "1em", fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", letterSpacing: 0.3, whiteSpace: "nowrap" }}>
                    JSON Explorer
                </span>
            </div>

            {/* Tab buttons — desktop only */}
            {!isMobile && (
                <div style={{ display: "flex", flex: 1, height: "100%", overflowX: "auto", scrollbarWidth: "none" }}>
                    {tabs.map(t => {
                        const isActive = activeTab === t.id;
                        return (
                            <button key={t.id}
                                onClick={() => onSwitchTab(t.id)}
                                style={{ padding: "0 18px", height: "100%", background: isActive ? "var(--accent-bg)" : "none", border: "none", flexShrink: 0, borderBottom: isActive ? "2px solid var(--accent)" : "2px solid transparent", borderTop: "2px solid transparent", color: isActive ? "var(--text)" : "var(--text-dim)", cursor: "pointer", fontFamily: "'Space Grotesk', monospace", fontSize: "0.93em", fontWeight: isActive ? 600 : 400, letterSpacing: 0.3, whiteSpace: "nowrap", transition: "all 0.15s" }}>
                                <span style={{ marginRight: 6, opacity: 0.7 }}>{t.icon}</span>{t.label}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}