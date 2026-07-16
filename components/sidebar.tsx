"use client";
import { ReactNode, useEffect, useState } from "react";

interface Tab { id: string; label: string; icon: ReactNode; group: "primary" | "tools" | "system"; shortcut?: number; }
interface Props {
    tabs: Tab[]; activeTab: string; onSwitchTab: (id: string) => void;
    theme: string; onToggleTheme: () => void; hasData: boolean;
}

const COLLAPSE_KEY = "json-explorer:sidebar-collapsed";
const RAIL_WIDTH = 60;

const ChevronIcon = ({ flip }: { flip: boolean }) => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
        style={{ transform: flip ? "rotate(180deg)" : "none", transition: "transform 0.2s var(--ease-out)" }}>
        <polyline points="15 18 9 12 15 6" />
    </svg>
);

export function Sidebar({ tabs, activeTab, onSwitchTab, theme, onToggleTheme, hasData }: Props) {
    const [collapsed, setCollapsed] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;
        setCollapsed(window.localStorage.getItem(COLLAPSE_KEY) === "1");
    }, []);

    const toggleCollapsed = () => {
        setCollapsed(c => {
            const next = !c;
            window.localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
            return next;
        });
    };

    const primary = tabs.filter(t => t.group === "primary");
    const tools = tabs.filter(t => t.group === "tools");
    const system = tabs.filter(t => t.group === "system");

    const renderItem = (t: Tab, emphasized = false) => {
        const isActive = activeTab === t.id;
        const title = collapsed ? `${t.label}${t.shortcut ? ` (${t.shortcut})` : ""}` : undefined;
        return (
            <button key={t.id} onClick={() => onSwitchTab(t.id)} title={title}
                style={{
                    display: "flex", alignItems: "center", gap: 10, width: "100%",
                    justifyContent: collapsed ? "center" : "flex-start",
                    padding: collapsed ? "10px 0" : emphasized ? "10px 12px" : "8px 12px",
                    background: isActive ? "var(--accent-bg)" : emphasized ? "var(--surface)" : "transparent",
                    border: "none", borderRadius: "var(--radius-md)",
                    color: isActive ? "var(--accent)" : "var(--text-dim)",
                    cursor: "pointer", fontFamily: "var(--font-ui)",
                    fontSize: emphasized ? "0.92em" : "0.86em",
                    fontWeight: isActive ? 600 : 500,
                    textAlign: "left",
                }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.color = "var(--text)"; e.currentTarget.style.background = "var(--surface-hover)"; } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.color = "var(--text-dim)"; e.currentTarget.style.background = emphasized ? "var(--surface)" : "transparent"; } }}
            >
                <span style={{ display: "inline-flex", alignItems: "center", opacity: isActive ? 1 : 0.75, flexShrink: 0, position: "relative" }}>
                    {t.icon}
                    {t.id === "explorer" && hasData && (
                        <span title="JSON loaded" style={{
                            position: "absolute", top: -2, right: -3, width: 6, height: 6, borderRadius: "50%",
                            background: "var(--success)", border: "1.5px solid var(--panel)",
                        }} />
                    )}
                </span>
                {!collapsed && <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.label}</span>}
                {!collapsed && t.shortcut !== undefined && (
                    <span className="mono" style={{
                        flexShrink: 0, fontSize: "0.72em", color: "var(--text-faint)",
                        background: "var(--panel)", border: "1px solid var(--border-faint)",
                        borderRadius: 4, padding: "0 5px", opacity: isActive ? 1 : 0.7,
                    }}>
                        {t.shortcut}
                    </span>
                )}
            </button>
        );
    };

    return (
        <div style={{
            width: collapsed ? RAIL_WIDTH : "var(--sidebar-width)", flexShrink: 0,
            background: "var(--panel)", borderRight: "1px solid var(--border)",
            display: "flex", flexDirection: "column", height: "100%", overflow: "hidden",
            transition: "width 0.18s var(--ease-out)",
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: collapsed ? "18px 0 16px" : "18px 12px 16px 16px", justifyContent: collapsed ? "center" : "flex-start", flexShrink: 0 }}>
                <svg width="26" height="26" viewBox="0 0 28 28" fill="none" style={{ flexShrink: 0 }}>
                    <rect width="28" height="28" rx="8" fill="url(#sidebar-lg)" />
                    <defs>
                        <linearGradient id="sidebar-lg" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#818cf8" />
                            <stop offset="1" stopColor="#c084fc" />
                        </linearGradient>
                    </defs>
                    <text x="5" y="20" fontFamily="monospace" fontWeight="800" fontSize="16" fill="white">{"{ }"}</text>
                </svg>
                {!collapsed && (
                    <>
                        <span style={{ color: "var(--text)", fontSize: "1em", fontWeight: 700, fontFamily: "var(--font-display)", letterSpacing: -0.3, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            JSON Explorer
                        </span>
                        <button onClick={toggleCollapsed} title="Collapse sidebar"
                            style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, flexShrink: 0, background: "none", border: "none", borderRadius: "var(--radius-sm)", color: "var(--text-faint)", cursor: "pointer" }}
                            onMouseEnter={e => { e.currentTarget.style.color = "var(--text)"; e.currentTarget.style.background = "var(--surface)"; }}
                            onMouseLeave={e => { e.currentTarget.style.color = "var(--text-faint)"; e.currentTarget.style.background = "none"; }}>
                            <ChevronIcon flip={false} />
                        </button>
                    </>
                )}
            </div>

            {collapsed && (
                <div style={{ display: "flex", justifyContent: "center", paddingBottom: 10, flexShrink: 0 }}>
                    <button onClick={toggleCollapsed} title="Expand sidebar"
                        style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 26, height: 22, background: "none", border: "1px solid var(--border-faint)", borderRadius: "var(--radius-sm)", color: "var(--text-faint)", cursor: "pointer" }}
                        onMouseEnter={e => { e.currentTarget.style.color = "var(--text)"; e.currentTarget.style.borderColor = "var(--border-strong)"; }}
                        onMouseLeave={e => { e.currentTarget.style.color = "var(--text-faint)"; e.currentTarget.style.borderColor = "var(--border-faint)"; }}>
                        <ChevronIcon flip={true} />
                    </button>
                </div>
            )}

            <div style={{ padding: collapsed ? "2px 8px" : "2px 10px", display: "flex", flexDirection: "column", gap: 2, flexShrink: 0 }}>
                {primary.map(t => renderItem(t, true))}
            </div>

            {!collapsed && (
                <div style={{ marginTop: 18, padding: "0 16px 6px", flexShrink: 0 }}>
                    <span className="panel-label">Tools</span>
                </div>
            )}
            {collapsed && <div style={{ margin: "14px 14px 10px", borderTop: "1px solid var(--border-faint)", flexShrink: 0 }} />}
            <div style={{ padding: collapsed ? "0 8px" : "0 10px", display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>
                {tools.map(t => renderItem(t))}
            </div>

            <div style={{ flex: 1, minHeight: 8 }} />

            <div style={{ padding: collapsed ? "8px" : "8px 10px", borderTop: "1px solid var(--border-faint)", flexShrink: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                <button onClick={onToggleTheme} title={`Switch to ${theme === "Midnight" ? "Paper" : "Midnight"} theme`}
                    style={{
                        display: "flex", alignItems: "center", gap: 10, width: "100%",
                        justifyContent: collapsed ? "center" : "flex-start",
                        padding: collapsed ? "8px 0" : "8px 12px", background: "transparent", border: "none",
                        borderRadius: "var(--radius-md)", color: "var(--text-dim)", cursor: "pointer",
                        fontFamily: "var(--font-ui)", fontSize: "0.86em", fontWeight: 500, textAlign: "left",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = "var(--text)"; e.currentTarget.style.background = "var(--surface)"; }}
                    onMouseLeave={e => { e.currentTarget.style.color = "var(--text-dim)"; e.currentTarget.style.background = "transparent"; }}>
                    <span style={{ display: "inline-flex", alignItems: "center", opacity: 0.75, flexShrink: 0 }}>
                        {theme === "Midnight" ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                            </svg>
                        ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="4" />
                                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                            </svg>
                        )}
                    </span>
                    {!collapsed && (theme === "Midnight" ? "Dark" : "Light")}
                </button>
                {system.map(t => renderItem(t))}
            </div>
        </div>
    );
}
