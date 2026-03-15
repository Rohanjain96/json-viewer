"use client";
import { useState, useCallback, useEffect, useRef, useTransition, useMemo } from "react";
import { useBreakpoint } from "@/hooks/use-breakpoints";
import { TreeNode } from "@/components/tree-node";
import { DiffViewer } from "@/components/tabs/diff-viewer";
import { PasteTab } from "@/components/tabs/paste-tab";
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
import { queryJSON } from "@/utils/json-query";
import { QueryExamplesDrawer } from "@/components/query-bar-examples";

// ─── TABS ────────────────────────────────────────────────────────────────────
const TABS = [
  { id: "paste", label: "Import", icon: "⬆" },
  { id: "explorer", label: "Explorer", icon: "{ }" },
  { id: "diff", label: "Diff", icon: "⇄" },
  { id: "builder", label: "Builder", icon: "⊞" },
  { id: "settings", label: "Settings", icon: "⚙" },
];

// ─── SELECTED NODE TYPE ───────────────────────────────────────────────────────
interface SelectedNode {
  path: string;
  type: string;
  value: unknown;
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const { isMobile, isDesktop } = useBreakpoint();
  const copyModal = useCopyModal();
  const [, startTransition] = useTransition();

  // ── JSON state ──────────────────────────────────────────────────────────────
  const [json, setJson] = useState<JSONValue>({});
  const [jsonText, setJsonText] = useState("");

  // ── Query state ─────────────────────────────────────────────────────────────
  const [query, setQuery] = useState("");
  const [queryHistory, setQueryHistory] = useState<string[]>([]);
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [resultView, setResultView] = useState("json");

  // ── Autocomplete state ──────────────────────────────────────────────────────
  const [acActive, setAcActive] = useState(false);
  const [acIndex, setAcIndex] = useState(-1);
  const suggestions = useJsonPathSuggestions(json, acActive ? query : "");

  // ── UI state ────────────────────────────────────────────────────────────────
  const [selectedNode, setSelectedNode] = useState<SelectedNode | null>(null);
  const [activeTab, setActiveTab] = useState("paste");
  const [mobilePanel, setMobilePanel] = useState("tree");
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [showExamples, setShowExamples] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // ── Tree panel resize ────────────────────────────────────────────────────────
  const [treeWidth, setTreeWidth] = useState(isDesktop ? 420 : 270);
  const dragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartW = useRef(0);

  const pad = isMobile ? 12 : 20;
  const theme = THEMES[settings.theme] || THEMES.Dark;

  // ── Run query ────────────────────────────────────────────────────────────────
  const runQuery = useCallback((q = query) => {
    setTimeout(() => {
      const result = queryJSON(json, q);
      setQueryResult(result);
      setQueryHistory(h => [q, ...h.filter(x => x !== q)].slice(0, 8));
      if (isMobile) setMobilePanel("results");
    }, 0);
  }, [json, query, isMobile]);

  // ── Apply JSON from paste tab ────────────────────────────────────────────────
  const handleApplyJSON = useCallback((parsed: JSONValue) => {
    setQueryResult(null);
    setSelectedNode(null);
    setTimeout(() => {
      setJson(parsed);
      setTimeout(() => setActiveTab("explorer"), 50);
    }, 0);
  }, []);

  // ── Tab switch with transition overlay ──────────────────────────────────────
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

  // ── Drag handle ──────────────────────────────────────────────────────────────
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

  // ── Memoized tree nodes ──────────────────────────────────────────────────────
  const treeNodes = useMemo(() => (
    Object.entries(json as Record<string, JSONValue>).map(([k, v]) => (
      <TreeNode key={k} nodeKey={k} value={v} depth={0} path="" isMobile={isMobile} settings={settings}
        onNodeClick={node => { setSelectedNode(node); if (isMobile) setMobilePanel("results"); }} />
    ))
  ), [json, isMobile, settings]);

  // ── Render ───────────────────────────────────────────────────────────────────
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

      {/* Query bar — explorer only */}
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

      {/* Mobile tree/results switcher */}
      {isMobile && activeTab === "explorer" && (
        <div style={{ display: "flex", background: "var(--panel)", borderBottom: "1px solid var(--border-faint)", flexShrink: 0 }}>
          {[["tree", "{ } Tree"], ["results", "▶ Results"]].map(([id, label]) => (
            <button key={id} onClick={() => setMobilePanel(id)}
              style={{ flex: 1, padding: "9px", background: "none", border: "none", borderBottom: mobilePanel === id ? "2px solid var(--accent)" : "2px solid transparent", color: mobilePanel === id ? "var(--text)" : "var(--text-faint)", cursor: "pointer", fontFamily: "monospace", fontSize: "0.86em" }}>
              {label}
            </button>
          ))}
        </div>
      )}

      {/* ── MAIN WORKSPACE ── */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", minHeight: 0, position: "relative" }}>

        {/* Transition overlay */}
        {isTransitioning && (
          <div style={{ position: "absolute", inset: 0, zIndex: 100, background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
            <div style={{ width: 24, height: 24, border: "2px solid var(--border)", borderTop: "2px solid var(--accent)", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
            <span style={{ color: "var(--text-faint)", fontSize: "0.79em", fontFamily: "monospace" }}>Loading...</span>
          </div>
        )}

        {/* ── IMPORT TAB ── */}
        {activeTab === "paste" && (
          <div style={{ flex: 1, padding: pad, overflowY: "auto", display: "flex", flexDirection: "column" }}>
            <div style={{ color: "var(--text-dim)", fontSize: "0.86em", letterSpacing: 1, marginBottom: 16, fontWeight: 700 }}>
              Import JSON
            </div>
            <PasteTab jsonText={jsonText} setJsonText={setJsonText} onApply={handleApplyJSON} />
          </div>
        )}

        {/* ── EXPLORER TAB ── */}
        {activeTab === "explorer" && (
          <>
            {/* Left panel: tree + examples drawer + history */}
            {(!isMobile || mobilePanel === "tree") && (
              <div style={{ width: isMobile ? "100%" : treeWidth, display: "flex", flexDirection: "column", flexShrink: 0, minWidth: isMobile ? "100%" : 200, overflow: "hidden" }}>

                {/* Tree */}
                <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
                  <div style={{ padding: `12px ${pad}px 8px`, color: "var(--text-dim)", fontSize: "0.72em", letterSpacing: 2, flexShrink: 0, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span>JSON TREE</span>
                    {!isMobile && <span style={{ color: "var(--text-faint)", fontSize: "0.64em" }}>{treeWidth}px ↔</span>}
                  </div>
                  <div style={{ padding: `0 ${isMobile ? 8 : 4}px`, flex: 1 }}>
                    {treeNodes}
                  </div>
                </div>

                {/* Examples drawer */}
                <QueryExamplesDrawer
                  open={showExamples}
                  onToggle={() => setShowExamples(s => !s)}
                  onSelectExample={q => { setQuery(q); runQuery(q); }}
                />

                {/* Query history */}
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

            {/* Drag handle */}
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

            {/* Right panel: results + inspector */}
            {(!isMobile || mobilePanel === "results") && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
                <ResultsPanel
                  queryResult={queryResult}
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

        {/* ── OTHER TABS ── */}
        {!["paste", "explorer"].includes(activeTab) && (
          <div style={{ flex: 1, padding: pad, overflowY: "auto", minWidth: 0 }}>
            {activeTab === "diff" && (
              <>
                <div style={{ color: "var(--text-dim)", fontSize: "0.86em", letterSpacing: 1, marginBottom: 16, fontWeight: 700 }}>JSON Diff Viewer</div>
                <DiffViewer />
              </>
            )}
            {activeTab === "builder" && (
              <>
                <div style={{ color: "var(--text-dim)", fontSize: "0.86em", letterSpacing: 1, marginBottom: 16, fontWeight: 700 }}>Visual Query Builder</div>
                <VisualQueryBuilder
                  key={JSON.stringify(json)}
                  onQuery={q => { setQuery(q); setActiveTab("explorer"); runQuery(q); }}
                  json={json}
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

      {/* Status bar — desktop */}
      {!isMobile && (
        <StatusBar
          activeTab={activeTab}
          selectedNodePath={selectedNode?.path ?? null}
          queryResult={queryResult}
        />
      )}

      {/* Mobile bottom nav */}
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