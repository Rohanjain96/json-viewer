"use client";
import { ReactNode } from "react";

interface Tab { id: string; label: string; icon: ReactNode; }
interface Props { tabs: Tab[]; activeTab: string; onSwitchTab: (id: string) => void; }

export function MobileBottomNav({ tabs, activeTab, onSwitchTab }: Props) {
    return (
        <div style={{ background: "var(--panel)", borderTop: "1px solid var(--border)", display: "flex", flexShrink: 0, boxShadow: "0 -4px 16px rgba(0,0,0,0.16)" }}>
            {tabs.map(t => {
                const isActive = activeTab === t.id;
                return (
                    <button key={t.id} onClick={() => onSwitchTab(t.id)}
                        style={{ flex: 1, padding: "8px 2px 9px", background: "none", border: "none", borderTop: isActive ? "2px solid var(--accent)" : "2px solid transparent", color: isActive ? "var(--accent)" : "var(--text-faint)", cursor: "pointer", fontSize: "0.62em", fontWeight: isActive ? 600 : 500, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, transition: "color 0.15s var(--ease-out)" }}>
                        <span style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>{t.icon}</span>
                        <span>{t.label}</span>
                    </button>
                );
            })}
        </div>
    );
}