// ─── THEME DEFINITIONS ───────────────────────────────────────────────────────
export const THEMES = {
  Dark: {
    bg: "#07070f",
    surface: "#0d0d1e",
    panel: "#09091a",
    border: "#1e1e34",
    borderFaint: "#131323",
    text: "#c0c0e0",
    textDim: "#888aaa",
    textFaint: "#555577",
    accent: "#5555cc",
    accentBg: "#1e1e44",
    nodeKey: "#9d9de8",
    nodeStr: "#ffcc80",
    nodeNum: "#80cbc4",
    nodeBool: "#ef9a7a",
    nodeNull: "#b39ddb",
    scrollThumb: "#2a2a40",
    inputBg: "#09091a",
    inputColor: "#c0c0e0",
    btnDanger: "#e05555",
    danger: "#3a1010",
    dangerBorder: "#5a2020",
    success: "#4caf7d",
    successBg: "#0d2a1a",
    successBorder: "#1a4a2a",
    tagBg: "#111128",
    tagBorder: "#2a2a50",
    tagColor: "#7777bb",
    overlay: "#000000cc",
  },
  Darker: {
    bg: "#000005",
    surface: "#070710",
    panel: "#04040c",
    border: "#111118",
    borderFaint: "#09090e",
    text: "#9090b8",
    textDim: "#666688",
    textFaint: "#444460",
    accent: "#4444aa",
    accentBg: "#16163a",
    nodeKey: "#8080cc",
    nodeStr: "#d4a840",
    nodeNum: "#5ab0a0",
    nodeBool: "#cc7744",
    nodeNull: "#9077aa",
    scrollThumb: "#1e1e30",
    inputBg: "#030308",
    inputColor: "#9090b8",
    btnDanger: "#cc4444",
    danger: "#2a0808",
    dangerBorder: "#4a1818",
    success: "#3a9960",
    successBg: "#081a10",
    successBorder: "#143a20",
    tagBg: "#0a0a18",
    tagBorder: "#1e1e38",
    tagColor: "#6666aa",
    overlay: "#000000dd",
  },
  Midnight: {
    bg: "#000d1a",
    surface: "#001428",
    panel: "#000f20",
    border: "#0a2040",
    borderFaint: "#061530",
    text: "#88aacc",
    textDim: "#557799",
    textFaint: "#336688",
    accent: "#2266aa",
    accentBg: "#0d2a44",
    nodeKey: "#6699cc",
    nodeStr: "#88bbdd",
    nodeNum: "#44aaaa",
    nodeBool: "#6688ff",
    nodeNull: "#8866aa",
    scrollThumb: "#0a2a44",
    inputBg: "#000a15",
    inputColor: "#88aacc",
    btnDanger: "#cc4455",
    danger: "#1a0810",
    dangerBorder: "#3a1828",
    success: "#3a9977",
    successBg: "#041a15",
    successBorder: "#0a3028",
    tagBg: "#001020",
    tagBorder: "#0a2a40",
    tagColor: "#4488aa",
    overlay: "#000010dd",
  },
  Light: {
    bg: "#f5f5f5",
    surface: "#ffffff",
    panel: "#ebebeb",
    border: "#cccccc",
    borderFaint: "#e2e2e2",
    text: "#111111",
    textDim: "#444444",
    textFaint: "#888888",
    accent: "#2563eb",
    accentBg: "#eff6ff",
    nodeKey: "#1d4ed8",
    nodeStr: "#15803d",
    nodeNum: "#0369a1",
    nodeBool: "#b45309",
    nodeNull: "#7c3aed",
    scrollThumb: "#bbbbbb",
    inputBg: "#ffffff",
    inputColor: "#111111",
    btnDanger: "#dc2626",
    danger: "#fef2f2",
    dangerBorder: "#fca5a5",
    success: "#16a34a",
    successBg: "#f0fdf4",
    successBorder: "#86efac",
    tagBg: "#eff6ff",
    tagBorder: "#bfdbfe",
    tagColor: "#1d4ed8",
    overlay: "#00000044",
  },
} as const;

export type ThemeKey = keyof typeof THEMES;
export type Theme = (typeof THEMES)[ThemeKey];

export interface Settings {
  theme: ThemeKey;
  fontSize: string;
  collapseDepth: string;
  lineNumbers: boolean;
  wordWrap: boolean;
  typeHints: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: "Dark",
  fontSize: "14px",
  collapseDepth: "2",
  lineNumbers: true,
  wordWrap: true,
  typeHints: true,
};

// Inject all CSS variables for the active theme + font size
export function buildThemeStyle(theme: Theme, fontSize: string): string {
  return `
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;700&family=Space+Grotesk:wght@400;500;600&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    :root{
      --bg:${theme.bg};--surface:${theme.surface};--panel:${theme.panel};
      --border:${theme.border};--border-faint:${theme.borderFaint};
      --text:${theme.text};--text-dim:${theme.textDim};--text-faint:${theme.textFaint};
      --accent:${theme.accent};--accent-bg:${theme.accentBg};
      --node-key:${theme.nodeKey};--node-str:${theme.nodeStr};--node-num:${theme.nodeNum};
      --node-bool:${theme.nodeBool};--node-null:${theme.nodeNull};
      --scroll:${theme.scrollThumb};
      --input-bg:${theme.inputBg};--input-color:${theme.inputColor};
      --danger:${theme.danger};--danger-border:${theme.dangerBorder};--btn-danger:${theme.btnDanger};
      --success:${theme.success};--success-bg:${theme.successBg};--success-border:${theme.successBorder};
      --tag-bg:${theme.tagBg};--tag-border:${theme.tagBorder};--tag-color:${theme.tagColor};
      --overlay:${theme.overlay};
    }
    html,body,#root{font-size:${fontSize};}
    input,textarea,select{background:var(--input-bg) !important;color:var(--input-color) !important;}
    ::-webkit-scrollbar{width:5px;height:5px}
    ::-webkit-scrollbar-track{background:var(--bg)}
    ::-webkit-scrollbar-thumb{background:var(--scroll);border-radius:3px}
    .tree-row:hover{background:var(--surface) !important}
    input,textarea,select{-webkit-tap-highlight-color:transparent}
    select option{background:var(--panel)}
    textarea::placeholder{color:var(--text-faint)}
    input::placeholder{color:var(--text-faint)}
  `;
}
