"use client";

interface Props { pad: number; currentLabel: string; theme: string; onToggleTheme: () => void; }

// Mobile-only identity bar. Desktop navigation lives in the Sidebar; on mobile
// the Sidebar is hidden and MobileBottomNav handles switching, so this strip
// carries brand identity, the current page name, and a quick theme toggle
// (the desktop equivalent lives in the Sidebar footer).
export function TopBar({ pad, currentLabel, theme, onToggleTheme }: Props) {
    return (
        <div style={{ background: "var(--panel)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", height: 52, flexShrink: 0, boxShadow: "var(--shadow-sm)", position: "relative", zIndex: 20, padding: `0 ${pad}px` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <svg width="22" height="22" viewBox="0 0 28 28" fill="none" style={{ flexShrink: 0 }}>
                    <rect width="28" height="28" rx="8" fill="url(#topbar-lg)" />
                    <defs>
                        <linearGradient id="topbar-lg" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#818cf8" />
                            <stop offset="1" stopColor="#c084fc" />
                        </linearGradient>
                    </defs>
                    <text x="5" y="20" fontFamily="monospace" fontWeight="800" fontSize="16" fill="white">{"{ }"}</text>
                </svg>
                <span style={{ color: "var(--text)", fontSize: "0.94em", fontWeight: 700, fontFamily: "var(--font-display)", letterSpacing: -0.3, whiteSpace: "nowrap" }}>
                    JSON Explorer
                </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ color: "var(--text-dim)", fontSize: "0.82em", fontWeight: 500, whiteSpace: "nowrap" }}>
                    {currentLabel}
                </span>
                <button onClick={onToggleTheme} title={`Switch to ${theme === "Midnight" ? "Paper" : "Midnight"} theme`}
                    style={{
                        display: "flex", alignItems: "center", justifyContent: "center",
                        width: 30, height: 30, background: "var(--surface)", border: "1px solid var(--border)",
                        borderRadius: "var(--radius-md)", color: "var(--text-dim)", cursor: "pointer", flexShrink: 0,
                    }}>
                    {theme === "Midnight" ? (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                        </svg>
                    ) : (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="4" />
                            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                        </svg>
                    )}
                </button>
            </div>
        </div>
    );
}
