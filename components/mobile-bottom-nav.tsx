"use client";

interface Tab {
    id: string;
    label: string;
    icon: string;
}

interface Props {
    tabs: Tab[];
    activeTab: string;
    onSwitchTab: (id: string) => void;
}

export function MobileBottomNav({ tabs, activeTab, onSwitchTab }: Props) {
    return (
        <div style={{ background: "var(--panel)", borderTop: "1px solid var(--border)", display: "flex", flexShrink: 0 }}>
            {tabs.map(t => (
                <button key={t.id}
                    onClick={() => onSwitchTab(t.id)}
                    style={{ flex: 1, padding: "8px 2px 10px", background: "none", border: "none", borderTop: activeTab === t.id ? "2px solid var(--accent)" : "2px solid transparent", color: activeTab === t.id ? "var(--text)" : "var(--text-faint)", cursor: "pointer", fontFamily: "monospace", fontSize: "0.57em", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                    <span style={{ fontSize: "1.79em" }}>{t.icon}</span>
                    <span>{t.label}</span>
                </button>
            ))}
        </div>
    );
}