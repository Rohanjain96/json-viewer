"use client";
import { ReactNode } from "react";

interface Tab { id: string; label: string; icon: ReactNode; }
interface Props { tabs: Tab[]; activeTab: string; isMobile: boolean; pad: number; onSwitchTab: (id: string) => void; }

export function TopBar({ tabs, activeTab, isMobile, pad, onSwitchTab }: Props) {
    return (
        <div style={{ background: "var(--panel)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", height: 54, flexShrink: 0, overflow: "hidden", boxShadow: "var(--shadow-sm)", position: "relative", zIndex: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: `0 ${pad}px`, borderRight: !isMobile ? "1px solid var(--border)" : "none", height: "100%", flexShrink: 0 }}>
                <svg width="26" height="26" viewBox="0 0 28 28" fill="none" style={{ flexShrink: 0 }}>
                    <rect width="28" height="28" rx="8" fill="url(#lg)" />
                    <defs>
                        <linearGradient id="lg" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#818cf8" />
                            <stop offset="1" stopColor="#c084fc" />
                        </linearGradient>
                    </defs>
                    <text x="5" y="20" fontFamily="monospace" fontWeight="800" fontSize="16" fill="white">{"{ }"}</text>
                </svg>
                <span style={{ color: "var(--text)", fontSize: "0.98em", fontWeight: 700, fontFamily: "var(--font-display)", letterSpacing: -0.3, whiteSpace: "nowrap" }}>
                    JSON Explorer
                </span>
            </div>

            {!isMobile && (
                <div style={{ display: "flex", flex: 1, height: "100%", overflowX: "auto", scrollbarWidth: "none", padding: "0 6px", alignItems: "center", gap: 2 }}>
                    {tabs.map(t => {
                        const isActive = activeTab === t.id;
                        return (
                            <button key={t.id} onClick={() => onSwitchTab(t.id)}
                                style={{
                                    padding: "7px 14px", height: 34,
                                    background: isActive ? "var(--accent-bg)" : "transparent",
                                    border: "none", borderRadius: "var(--radius-md)", flexShrink: 0,
                                    color: isActive ? "var(--accent)" : "var(--text-dim)",
                                    cursor: "pointer", fontFamily: "var(--font-ui)",
                                    fontSize: "0.86em", fontWeight: isActive ? 600 : 500,
                                    letterSpacing: -0.1, whiteSpace: "nowrap",
                                    display: "inline-flex", alignItems: "center",
                                }}
                                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.color = "var(--text)"; e.currentTarget.style.background = "var(--surface)"; } }}
                                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.color = "var(--text-dim)"; e.currentTarget.style.background = "transparent"; } }}>
                                <span style={{ marginRight: 7, opacity: isActive ? 1 : 0.6, display: "inline-flex", alignItems: "center" }}>{t.icon}</span>
                                {t.label}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}