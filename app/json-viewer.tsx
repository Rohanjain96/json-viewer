"use client";
import { useState, useCallback, useEffect, useRef, useTransition, useMemo } from "react";
import { useBreakpoint } from "@/hooks/use-breakpoints";
import { TreeNode } from "@/components/tree-node";
import { DiffViewer } from "@/components/tabs/diff-viewer";
import { PasteTab } from "@/components/tabs/paste-tab";
import { ApiFetchTab } from "@/components/tabs/api-fetch-tab";
import { SettingsPanel } from "@/components/tabs/settings-panel";
import { VisualQueryBuilder } from "@/components/tabs/visual-query-builder";
import { buildThemeStyle, DEFAULT_SETTINGS, Settings, THEMES } from "@/theme";
import { QueryResult } from "@/types/query";
import { JSONValue } from "@/types/json";
import { useJsonPathSuggestions } from "@/hooks/use-json-path-suggestions";
import { TopBar } from "@/components/top-bar";
import { QueryBar } from "@/components/query-bar";
import { ResultsPanel } from "@/components/results-panel";
import { NodeInspector } from "@/components/node-inspector";
import { StatusBar } from "@/components/status-bar";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { useCopyModal } from "@/components/clipboard";
import { queryAsync } from "@/utils/query-async";
import { QueryExamplesDrawer } from "@/components/query-bar-examples";
import { JsSandboxTab } from "@/components/tabs/js-sandbox";

// ─── Inline tab icons (no external icon library required) ─────────────────
const iconProps = {
  width: 16,
  height: 16,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const UploadIcon = () => (
  <svg {...iconProps}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const ApiIcon = () => (
  <svg {...iconProps}>
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const BracesIcon = () => (
  <svg {...iconProps}>
    <path d="M8 3H7a2 2 0 0 0-2 2v3a2 2 0 0 1-2 2 2 2 0 0 1 2 2v3a2 2 0 0 0 2 2h1" />
    <path d="M16 3h1a2 2 0 0 1 2 2v3a2 2 0 0 0 2 2 2 2 0 0 0-2 2v3a2 2 0 0 1-2 2h-1" />
  </svg>
);

const DiffIcon = () => (
  <svg {...iconProps}>
    <polyline points="17 1 21 5 17 9" />
    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
    <polyline points="7 23 3 19 7 15" />
    <path d="M21 13v2a4 4 0 0 1-4 4H3" />
  </svg>
);

const BuilderIcon = () => (
  <svg {...iconProps}>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const SandboxIcon = () => (
  <svg {...iconProps}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const SettingsIcon = () => (
  <svg {...iconProps}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const TABS = [
  { id: "paste", label: "Import", icon: <UploadIcon /> },
  { id: "api", label: "API", icon: <ApiIcon /> },
  { id: "explorer", label: "Explorer", icon: <BracesIcon /> },
  { id: "diff", label: "Diff", icon: <DiffIcon /> },
  { id: "builder", label: "Builder", icon: <BuilderIcon /> },
  { id: "sandbox", label: "JS Query", icon: <SandboxIcon /> },
  { id: "settings", label: "Settings", icon: <SettingsIcon /> },
];

interface SelectedNode {
  path: string;
  type: string;
  value: unknown;
}

export default function App() {
  const { isMobile, isDesktop } = useBreakpoint();
  const copyModal = useCopyModal();
  const [, startTransition] = useTransition();

  // Heavy parsed JSON lives in a ref, never in React state.
  // Only a cheap version counter goes into state to trigger re-renders.
  const jsonRef = useRef<JSONValue>({});
  const [jsonVersion, setJsonVersion] = useState(0);

  const pasteTextRef = useRef("");
  const getPasteText = useCallback(() => pasteTextRef.current, []);
  const setPasteText = useCallback((t: string) => { pasteTextRef.current = t; }, []);

  const [query, setQuery] = useState("");
  const [queryHistory, setQueryHistory] = useState<string[]>([]);
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [resultView, setResultView] = useState("json");

  const [acActive, setAcActive] = useState(false);
  const [acIndex, setAcIndex] = useState(-1);
  // Only pass the real ref/query into the hook when autocomplete is open,
  // so it doesn't re-traverse a large object on every keystroke.
  const suggestions = useJsonPathSuggestions(
    acActive ? jsonRef.current : {},
    acActive ? query : ""
  );

  const [selectedNode, setSelectedNode] = useState<SelectedNode | null>(null);
  const [activeTab, setActiveTab] = useState("paste");
  const [mobilePanel, setMobilePanel] = useState("tree");
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [showExamples, setShowExamples] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Stable key for VisualQueryBuilder — the cheap version counter,
  // not a stringified copy of the JSON.
  const builderKey = jsonVersion;

  const [treeWidth, setTreeWidth] = useState(isDesktop ? 420 : 270);
  const dragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartW = useRef(0);

  const pad = isMobile ? 12 : 20;
  const theme = THEMES[settings.theme] || THEMES.Dark;

  const [queryRunning, setQueryRunning] = useState(false);
  const latestQueryId = useRef(0);

  const runQuery = useCallback(async (q?: string) => {
    const path = typeof q === "string" ? q : query;
    const queryId = ++latestQueryId.current;
    setQueryRunning(true);
    setQueryResult(null);

    const result = await queryAsync(jsonRef.current, path);

    if (queryId !== latestQueryId.current) return; // stale response, discard
    setQueryResult(result);
    setQueryRunning(false);
    setQueryHistory(h => [path, ...h.filter(x => x !== path)].slice(0, 8));
    if (isMobile) setMobilePanel("results");
  }, [query, isMobile]);

  const handleApplyJSON = useCallback((parsed: JSONValue) => {
    jsonRef.current = parsed;
    setQueryResult(null);
    setSelectedNode(null);
    setJsonVersion(v => v + 1);
    setTimeout(() => setActiveTab("explorer"), 50);
  }, []);

  const switchTab = useCallback((tabId: string) => {
    if (activeTab === tabId) return;
    setIsTransitioning(true);
    setTimeout(() => {
      startTransition(() => {
        setActiveTab(tabId);
        if (tabId === "explorer") setMobilePanel("tree");
      });
      setTimeout(() => setIsTransitioning(false), 0);
    }, 0);
  }, [activeTab, startTransition]);

  const onDragStart = useCallback((e: React.MouseEvent) => {
    dragging.current = true;
    dragStartX.current = e.clientX;
    dragStartW.current = treeWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    const onMove = (ev: MouseEvent) => {
      if (!dragging.current) return;
      setTreeWidth(Math.max(180, Math.min(dragStartW.current + ev.clientX - dragStartX.current, window.innerWidth * 0.72)));
    };
    const onUp = () => {
      dragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [treeWidth]);

  // Caps initial root render to 200 entries so a flat 10k-item array
  // doesn't mount thousands of nodes at once.
  const [rootVisibleCount, setRootVisibleCount] = useState(200);

  useEffect(() => { setRootVisibleCount(200); }, [jsonVersion]);

  const treeNodes = useMemo(() => {
    const json = jsonRef.current;
    const entries = Object.entries(json as Record<string, JSONValue>);
    const visible = entries.slice(0, rootVisibleCount);
    const remaining = entries.length - rootVisibleCount;

    return (
      <>
        {visible.map(([k, v]) => (
          <TreeNode
            key={k}
            nodeKey={Array.isArray(json) ? Number(k) : k}
            value={v}
            depth={0}
            path=""
            isMobile={isMobile}
            settings={settings}
            onNodeClick={node => {
              setSelectedNode(node);
              if (isMobile) setMobilePanel("results");
            }}
          />
        ))}
        {remaining > 0 && (
          <div
            onClick={() => setRootVisibleCount(c => Math.min(c + 200, entries.length))}
            style={{
              padding: "5px 8px 5px 26px",
              color: "var(--accent)", fontSize: "0.79em",
              fontFamily: "monospace", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "var(--surface)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            ▸ Show {Math.min(200, remaining)} more
            <span style={{ color: "var(--text-faint)" }}>({remaining} remaining)</span>
          </div>
        )}
      </>
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jsonVersion, rootVisibleCount, isMobile, settings]);

  return (
    <div style={{ height: "100vh", background: theme.bg, color: theme.text, fontFamily: "'JetBrains Mono','Fira Code',monospace", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {copyModal}
      <style>{buildThemeStyle(theme, settings.fontSize)}</style>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <TopBar
        tabs={TABS}
        activeTab={activeTab}
        isMobile={isMobile}
        pad={pad}
        onSwitchTab={switchTab}
      />

      {activeTab === "explorer" && (
        <QueryBar
          query={query}
          setQuery={setQuery}
          onRun={runQuery}
          onClear={() => { setQuery(""); setQueryResult(null); }}
          suggestions={suggestions}
          acActive={acActive}
          acIndex={acIndex}
          setAcActive={setAcActive}
          setAcIndex={setAcIndex}
          isMobile={isMobile}
          pad={pad}
        />
      )}

      {isMobile && activeTab === "explorer" && (
        <div style={{ display: "flex", background: "var(--panel)", borderBottom: "1px solid var(--border-faint)", flexShrink: 0 }}>
          {[["tree", "{ } Tree"], ["results", "▶ Results"]].map(([id, label]) => (
            <button key={id} onClick={() => setMobilePanel(id as string)}
              style={{ flex: 1, padding: "9px", background: "none", border: "none", borderBottom: mobilePanel === id ? "2px solid var(--accent)" : "2px solid transparent", color: mobilePanel === id ? "var(--text)" : "var(--text-faint)", cursor: "pointer", fontFamily: "monospace", fontSize: "0.86em" }}>
              {label}
            </button>
          ))}
        </div>
      )}

      <div style={{ flex: 1, overflow: "hidden", display: "flex", minHeight: 0, position: "relative" }}>

        {isTransitioning && (
          <div style={{ position: "absolute", inset: 0, zIndex: 100, background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
            <div style={{ width: 24, height: 24, border: "2px solid var(--border)", borderTop: "2px solid var(--accent)", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
            <span style={{ color: "var(--text-faint)", fontSize: "0.79em", fontFamily: "monospace" }}>Loading...</span>
          </div>
        )}

        {activeTab === "paste" && (
          <div style={{ flex: 1, padding: pad, overflowY: "auto", display: "flex", flexDirection: "column" }}>
            <div style={{ color: "var(--text-dim)", fontSize: "0.86em", letterSpacing: 1, marginBottom: 16, fontWeight: 700 }}>
              Import JSON
            </div>
            <PasteTab
              onApply={handleApplyJSON}
              getPasteText={getPasteText}
              setPasteText={setPasteText}
            />
          </div>
        )}

        {activeTab === "api" && (
          <div style={{ flex: 1, padding: pad, overflowY: "auto", display: "flex", flexDirection: "column" }}>
            <div style={{ color: "var(--text-dim)", fontSize: "0.86em", letterSpacing: 1, marginBottom: 16, fontWeight: 700 }}>
              API Fetch
            </div>
            <ApiFetchTab
              onLoadToImport={(text) => {
                // Push fetched response text into the shared paste ref, then
                // switch to Import so the user can edit/fix it before applying.
                setPasteText(text);
                switchTab("paste");
              }}
            />
          </div>
        )}

        {activeTab === "explorer" && (
          <>
            {(!isMobile || mobilePanel === "tree") && (
              <div style={{ width: isMobile ? "100%" : treeWidth, display: "flex", flexDirection: "column", flexShrink: 0, minWidth: isMobile ? "100%" : 200, overflow: "hidden" }}>

                <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
                  <div style={{ padding: `12px ${pad}px 8px`, color: "var(--text-dim)", fontSize: "0.72em", letterSpacing: 2, flexShrink: 0, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span>JSON TREE</span>
                    {!isMobile && <span style={{ color: "var(--text-faint)", fontSize: "0.64em" }}>{treeWidth}px ↔</span>}
                  </div>
                  <div style={{ padding: `0 ${isMobile ? 8 : 4}px`, flex: 1 }}>
                    {treeNodes}
                  </div>
                </div>

                <QueryExamplesDrawer
                  open={showExamples}
                  onToggle={() => setShowExamples(s => !s)}
                  onSelectExample={q => { setQuery(q); runQuery(q); }}
                />

                {!isMobile && queryHistory.length > 0 && (
                  <div style={{ borderTop: "1px solid var(--border-faint)", padding: "6px 10px", display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center", flexShrink: 0, background: "var(--panel)" }}>
                    <span style={{ color: "var(--text-faint)", fontSize: "0.64em", letterSpacing: 1.5, fontWeight: 600, fontFamily: "monospace" }}>HISTORY</span>
                    {queryHistory.map((h, i) => (
                      <button key={i} onClick={() => { setQuery(h); runQuery(h); }}
                        style={{ padding: "2px 7px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 4, color: "var(--text-dim)", cursor: "pointer", fontSize: "0.64em", fontFamily: "monospace" }}>
                        {h.length > 22 ? h.slice(0, 22) + "…" : h}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!isMobile && (
              <div onMouseDown={onDragStart}
                style={{ width: 6, flexShrink: 0, cursor: "col-resize", background: "linear-gradient(to right, var(--border-faint), var(--border), var(--border-faint))", borderLeft: "1px solid var(--border)", borderRight: "1px solid var(--border)", transition: "background 0.15s", position: "relative", zIndex: 10 }}
                onMouseEnter={e => (e.currentTarget.style.background = "linear-gradient(to right, var(--border), var(--accent), var(--border))")}
                onMouseLeave={e => (e.currentTarget.style.background = "linear-gradient(to right, var(--border-faint), var(--border), var(--border-faint))")}>
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", display: "flex", flexDirection: "column", gap: 3 }}>
                  {[0, 1, 2].map(i => <div key={i} style={{ width: 2, height: 2, borderRadius: 1, background: "var(--border)" }} />)}
                </div>
              </div>
            )}

            {(!isMobile || mobilePanel === "results") && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
                <ResultsPanel
                  queryResult={queryResult}
                  queryRunning={queryRunning}
                  resultView={resultView}
                  setResultView={setResultView}
                  settings={settings}
                />
                <NodeInspector
                  selectedNode={selectedNode}
                  setSelectedNode={setSelectedNode}
                  isMobile={isMobile}
                />
                {isMobile && queryHistory.length > 0 && (
                  <div style={{ borderTop: "1px solid var(--border-faint)", padding: "8px 12px", display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center", flexShrink: 0 }}>
                    <span style={{ color: "var(--text-faint)", fontSize: "0.72em", letterSpacing: 1.5, fontWeight: 600 }}>HISTORY</span>
                    {queryHistory.map((h, i) => (
                      <button key={i} onClick={() => { setQuery(h); runQuery(h); }}
                        style={{ padding: "4px 8px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 4, color: "var(--text-dim)", cursor: "pointer", fontSize: "0.72em", fontFamily: "monospace" }}>
                        {h.length > 20 ? h.slice(0, 20) + "…" : h}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {!["paste", "api", "explorer"].includes(activeTab) && (
          <div style={{ flex: 1, padding: pad, overflowY: "auto", minWidth: 0 }}>
            {activeTab === "diff" && (
              <>
                <div style={{ color: "var(--text-dim)", fontSize: "0.86em", letterSpacing: 1, marginBottom: 16, fontWeight: 700 }}>JSON Diff Viewer</div>
                <DiffViewer />
              </>
            )}
            {activeTab === "sandbox" && (
              <>
                <div style={{ color: "var(--text-dim)", fontSize: "0.86em", letterSpacing: 1, marginBottom: 16, fontWeight: 700 }}>JS Sandbox</div>
                <JsSandboxTab json={jsonRef.current} />
              </>
            )}
            {activeTab === "builder" && (
              <>
                <div style={{ color: "var(--text-dim)", fontSize: "0.86em", letterSpacing: 1, marginBottom: 16, fontWeight: 700 }}>Visual Query Builder</div>
                <VisualQueryBuilder
                  key={builderKey}
                  onQuery={q => { setQuery(q); setActiveTab("explorer"); runQuery(q); }}
                  json={jsonRef.current}
                />
              </>
            )}
            {activeTab === "settings" && (
              <>
                <div style={{ color: "var(--text-dim)", fontSize: "0.86em", letterSpacing: 1, marginBottom: 16, fontWeight: 700 }}>Settings</div>
                <SettingsPanel settings={settings} setSettings={setSettings} />
              </>
            )}
          </div>
        )}
      </div>

      {!isMobile && (
        <StatusBar
          activeTab={activeTab}
          selectedNodePath={selectedNode?.path ?? null}
          queryResult={queryResult}
        />
      )}

      {isMobile && (
        <MobileBottomNav
          tabs={TABS}
          activeTab={activeTab}
          onSwitchTab={switchTab}
        />
      )}
    </div>
  );
}