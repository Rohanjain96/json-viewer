export interface Settings {
  theme: string;
  fontSize: string;
  collapseDepth: string;
  lineNumbers: boolean;
  wordWrap: boolean;
  typeHints: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: "Midnight",
  fontSize: "13px",
  collapseDepth: "2",
  lineNumbers: true,
  wordWrap: true,
  typeHints: true,
};

interface ThemeTokens {
  bg: string;
  bgElevated: string;
  panel: string;
  surface: string;
  surfaceHover: string;
  overlay: string;
  border: string;
  borderFaint: string;
  borderStrong: string;
  text: string;
  textDim: string;
  textFaint: string;
  inputBg: string;
  inputColor: string;
  accent: string;
  accentStrong: string;
  accentBg: string;
  accentBorder: string;
  success: string;
  successBg: string;
  successBorder: string;
  danger: string;
  dangerBorder: string;
  btnDanger: string;
  nodeKey: string;
  nodeStr: string;
  nodeNum: string;
  nodeBool: string;
  nodeNull: string;
  tagBg: string;
  tagColor: string;
  tagBorder: string;
}

export const THEMES: Record<string, ThemeTokens> = {
  Midnight: {
    bg: "#08090c",
    bgElevated: "#0d0f14",
    panel: "#101218",
    surface: "#161922",
    surfaceHover: "#1d212b",
    overlay: "rgba(5,6,9,0.75)",
    border: "#23262f",
    borderFaint: "#191c24",
    borderStrong: "#31353f",
    text: "#eceef1",
    textDim: "#9aa0ac",
    textFaint: "#5f6672",
    inputBg: "#0b0c10",
    inputColor: "#eceef1",
    accent: "#818cf8",
    accentStrong: "#6366f1",
    accentBg: "rgba(129,140,248,0.12)",
    accentBorder: "rgba(129,140,248,0.35)",
    success: "#3ddc97",
    successBg: "rgba(61,220,151,0.10)",
    successBorder: "rgba(61,220,151,0.30)",
    danger: "rgba(248,113,113,0.10)",
    dangerBorder: "rgba(248,113,113,0.30)",
    btnDanger: "#f87171",
    nodeKey: "#7dd3fc",
    nodeStr: "#86efac",
    nodeNum: "#fbbf85",
    nodeBool: "#c4b5fd",
    nodeNull: "#6b7280",
    tagBg: "rgba(129,140,248,0.10)",
    tagColor: "#a5b0ff",
    tagBorder: "rgba(129,140,248,0.30)",
  },
  Paper: {
    bg: "#f7f7f9",
    bgElevated: "#ffffff",
    panel: "#ffffff",
    surface: "#f1f1f5",
    surfaceHover: "#e9e9ef",
    overlay: "rgba(20,22,28,0.45)",
    border: "#e1e2e8",
    borderFaint: "#ececf0",
    borderStrong: "#cfd1da",
    text: "#16171c",
    textDim: "#565a66",
    textFaint: "#8b8f99",
    inputBg: "#ffffff",
    inputColor: "#16171c",
    accent: "#4f46e5",
    accentStrong: "#4338ca",
    accentBg: "rgba(79,70,229,0.08)",
    accentBorder: "rgba(79,70,229,0.28)",
    success: "#16a34a",
    successBg: "rgba(22,163,74,0.08)",
    successBorder: "rgba(22,163,74,0.26)",
    danger: "rgba(220,38,38,0.08)",
    dangerBorder: "rgba(220,38,38,0.26)",
    btnDanger: "#dc2626",
    nodeKey: "#0369a1",
    nodeStr: "#15803d",
    nodeNum: "#b45309",
    nodeBool: "#7c3aed",
    nodeNull: "#6b7280",
    tagBg: "rgba(79,70,229,0.08)",
    tagColor: "#4338ca",
    tagBorder: "rgba(79,70,229,0.26)",
  },
};

export function buildThemeStyle(t: ThemeTokens, fontSize: string) {
  return `
    :root {
      --bg:${t.bg}; --bg-elevated:${t.bgElevated}; --panel:${t.panel}; --surface:${t.surface};
      --surface-hover:${t.surfaceHover}; --overlay:${t.overlay};
      --border:${t.border}; --border-faint:${t.borderFaint}; --border-strong:${t.borderStrong};
      --text:${t.text}; --text-dim:${t.textDim}; --text-faint:${t.textFaint};
      --input-bg:${t.inputBg}; --input-color:${t.inputColor};
      --accent:${t.accent}; --accent-strong:${t.accentStrong}; --accent-bg:${t.accentBg}; --accent-border:${t.accentBorder};
      --success:${t.success}; --success-bg:${t.successBg}; --success-border:${t.successBorder};
      --danger:${t.danger}; --danger-border:${t.dangerBorder}; --btn-danger:${t.btnDanger};
      --node-key:${t.nodeKey}; --node-str:${t.nodeStr}; --node-num:${t.nodeNum};
      --node-bool:${t.nodeBool}; --node-null:${t.nodeNull};
      --tag-bg:${t.tagBg}; --tag-color:${t.tagColor}; --tag-border:${t.tagBorder};

      --font-ui: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      --font-display: 'Space Grotesk', var(--font-ui);
      --font-mono: 'JetBrains Mono', 'Fira Code', ui-monospace, SFMono-Regular, monospace;

      --text-xs: 0.72rem; --text-sm: 0.8125rem; --text-base: ${fontSize};
      --text-md: 0.9375rem; --text-lg: 1.05rem; --text-xl: 1.25rem; --text-2xl: 1.6rem;

      --radius-sm: 6px; --radius-md: 9px; --radius-lg: 14px; --radius-full: 999px;
      --shadow-sm: 0 1px 2px rgba(0,0,0,0.18);
      --shadow-md: 0 10px 28px rgba(0,0,0,0.30), 0 2px 6px rgba(0,0,0,0.18);
      --shadow-lg: 0 24px 64px rgba(0,0,0,0.38);
      --ease-out: cubic-bezier(0.16, 1, 0.3, 1);

      font-size: var(--text-base);
    }

    * { box-sizing: border-box; }

    body {
      font-family: var(--font-ui);
      -webkit-font-smoothing: antialiased;
      text-rendering: optimizeLegibility;
      letter-spacing: -0.01em;
    }

    code, pre, kbd, .mono { font-family: var(--font-mono); letter-spacing: 0; }

    ::selection { background: var(--accent); color: #fff; }

    ::-webkit-scrollbar { width: 10px; height: 10px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb {
      background: var(--border-strong);
      border-radius: var(--radius-full);
      border: 2px solid var(--bg);
      background-clip: padding-box;
    }
    ::-webkit-scrollbar-thumb:hover { background: var(--text-faint); }

    button, input, select, textarea { font-family: inherit; }
    button { transition: background 0.15s var(--ease-out), border-color 0.15s var(--ease-out), color 0.15s var(--ease-out), transform 0.1s var(--ease-out); }
    button:active { transform: scale(0.98); }

    input:focus-visible, select:focus-visible, textarea:focus-visible, button:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 1px;
    }
    input::placeholder, textarea::placeholder { color: var(--text-faint); }

    .tree-row { transition: background 0.12s var(--ease-out); border-radius: var(--radius-sm); }
    .tree-row:hover { background: var(--surface); }

    .card {
      background: var(--bg-elevated);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-sm);
    }

    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }

    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after { animation-duration: 0.001ms !important; transition-duration: 0.001ms !important; }
    }
  `;
}
